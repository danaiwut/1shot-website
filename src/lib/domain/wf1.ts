// Strict WF1 envelope parser, ported 1:1 from tvaccess/wf_contract.py `parse`.
// No trading, network calls or legacy fallback on malformed WF1.
import { createHash } from "node:crypto";
import { INDICATOR_MODES, INDICATOR_NAMES, isIndicatorCode, type IndicatorCode } from "./indicators";

export const LEVEL_FIELDS = ["PDH", "PDL", "PWH", "PWL", "PMH", "PML", "Daily Open", "Weekly Open", "Monthly Open"] as const;

const KINDS = {
  SETUP: "pending",
  ENTRY: "entry",
  RETEST: "retest",
  TP: "tp",
  SL: "sl",
  CANCEL: "cancel",
  EXPIRED: "expired",
  CLOSE: "close",
  INFO: "info",
  SUMMARY: "info",
} as const;

export type Wf1Event = keyof typeof KINDS;
export type SignalKind = (typeof KINDS)[Wf1Event];
export type Side = "BUY" | "SELL" | "NONE";

export interface ParsedSignalEvent {
  code: IndicatorCode;
  indicator: string;
  kind: SignalKind;
  event: Wf1Event;
  mode: string | undefined;
  side: string | undefined;
  symbol: string;
  feed_symbol: string;
  timeframe: string;
  version: string;
  setup_id: string;
  event_id: string;
  entry: number | null;
  sl: number | null;
  tp: number | null;
  exit: number | null;
  terminal: boolean;
  identity_status: string | undefined;
  /** unix seconds */
  observed_at: number;
  /** unix seconds */
  bar_time: number;
  setup: string;
  seq: string;
  key: string;
  contract: "WF1";
  levels?: Record<(typeof LEVEL_FIELDS)[number], number>;
  day_close?: number;
  feed_timezone?: string;
  no_marker?: boolean;
}

export class Wf1Error extends Error {}

const fail = (message: string): never => {
  throw new Wf1Error(message);
};

function count(text: string, needle: string) {
  return text.split(needle).length - 1;
}

function parseIntStrict(value: string | undefined): number | null {
  if (value === undefined || !/^[+-]?\d+$/.test(value.trim())) return null;
  return Number.parseInt(value, 10);
}

export function parseWf1(text: string, nowSeconds = Date.now() / 1000): ParsedSignalEvent[] {
  const blocks = [...text.matchAll(/\[WF1\]\s*\n([\s\S]*?)\n\[\/WF1\]/g)].map((m) => m[1]);
  if (!blocks.length || blocks.length !== count(text, "[WF1]") || blocks.length !== count(text, "[/WF1]")) fail("WF1 ไม่ครบ");

  const events: ParsedSignalEvent[] = [];
  for (const block of blocks) {
    const fields = new Map<string, string>();
    for (const line of block.split(/\r?\n/)) {
      const idx = line.indexOf(":");
      const key = idx < 0 ? "" : line.slice(0, idx);
      if (idx < 0 || fields.has(key)) fail("WF1 ฟิลด์ซ้ำหรือไม่ถูกต้อง");
      fields.set(key, line.slice(idx + 1).trim());
    }
    const get = (key: string) => fields.get(key);

    function num(key: string): number;
    function num(key: string, optional: boolean): number | null;
    function num(key: string, optional = false): number | null {
      const value = get(key) ?? "";
      if (optional && value === "") return null;
      const n = value.trim() === "" ? Number.NaN : Number(value);
      if (Number.isNaN(n)) fail("WF1 ราคาไม่ครบ");
      if (!Number.isFinite(n) || n <= 0) fail("WF1 ราคาไม่ถูกต้อง");
      return n;
    }

    const code = get("Indicator");
    const event = get("Event");
    const mode = get("Mode");
    const side = get("Side");
    const sid = get("Setup ID") ?? "";
    const eid = get("Event ID") ?? "";
    if (!isIndicatorCode(code) || !event || !Object.hasOwn(KINDS, event) || !eid || eid.length > 1500) {
      fail("WF1 ชนิดเหตุการณ์ไม่ถูกต้อง");
    }
    const ev = event as Wf1Event;
    const ind = code as IndicatorCode;

    const symbol = get("Symbol") ?? "";
    const tf = get("Timeframe") ?? "";
    const version = get("Version") ?? "";
    if (!/^[A-Za-z0-9_:./!-]{1,80}$/.test(symbol) || !/^[0-9]*[SDWM]?$/.test(tf) || !tf || !version) {
      fail("WF1 ตัวตนสัญญาณไม่ครบ");
    }

    const observedMs = parseIntStrict(get("Observed At Ms"));
    const barMs = parseIntStrict(get("Bar Time Ms"));
    if (observedMs === null || barMs === null) fail("WF1 เวลาไม่ถูกต้อง");
    const observed = observedMs! / 1000;
    const bar = barMs! / 1000;
    if (get("Time Unit") !== "unix_ms" || !(1e9 <= bar && bar <= observed + 1) || !(1e9 <= observed && observed <= nowSeconds + 60)) {
      fail("WF1 เวลาไม่ถูกต้อง");
    }

    const linked = get("Identity Status") === "LINKED";
    const info = ev === "INFO" || ev === "SUMMARY" || !linked;
    let reference: Partial<ParsedSignalEvent> = {};

    if (ind === "LV") {
      if (
        ev !== "INFO" || mode !== "None" || side !== "NONE" || linked ||
        get("Identity Status") !== "REFERENCE" || get("Terminal") !== "false" || tf !== "1D" ||
        ["Entry", "SL", "TP", "Exit"].some((k) => get(k))
      ) {
        fail("Period Levels ต้องเป็นข้อมูลอ้างอิงเท่านั้น");
      }
      const expected = `LV|${version}|${symbol}|${Math.trunc(bar * 1000)}`;
      if (sid !== expected || eid !== `${sid}:INFO`) fail("Period Levels ตัวตนไม่ตรงกับวันและฟีด");
      const levels = Object.fromEntries(LEVEL_FIELDS.map((k) => [k, num(k)])) as ParsedSignalEvent["levels"] & object;
      if (([["PDH", "PDL"], ["PWH", "PWL"], ["PMH", "PML"]] as const).some(([h, l]) => levels[h] < levels[l])) {
        fail("Period Levels High ต่ำกว่า Low");
      }
      const dayCloseMs = parseIntStrict(get("Day Close Ms"));
      if (dayCloseMs === null) fail("Period Levels ไม่มีเวลาปิดวัน");
      const dayClose = dayCloseMs! / 1000;
      if (!(bar < dayClose && dayClose <= bar + 2 * 86400)) fail("Period Levels เวลาปิดวันไม่ถูกต้อง");
      reference = { levels, day_close: dayClose, feed_timezone: get("Feed Timezone") ?? "", no_marker: true };
    }

    if (!info) {
      const pieces = sid.split("|");
      if (pieces.length < 10 || pieces[0] !== ind || pieces[1] !== version || pieces[3] !== symbol || pieces[4] !== tf || pieces[6] !== side) {
        fail("WF1 Setup ID ไม่ตรงกับข้อมูล");
      }
      const prefix = `${sid}:`;
      const suffix = eid.startsWith(prefix) ? eid.slice(prefix.length) : eid;
      if (!eid.startsWith(prefix) || !(suffix === ev || (ev === "TP" && suffix.startsWith("TP:")))) fail("WF1 Event ID ไม่ตรง");
      const modes = INDICATOR_MODES[ind as Exclude<IndicatorCode, "LV">] as readonly string[];
      if (!mode || !modes.includes(mode) || (side !== "BUY" && side !== "SELL")) fail("WF1 โหมดไม่ตรงกับอินดิเคเตอร์");
      if ((ev === "SETUP" && mode !== "Limit") || (ev === "RETEST" && mode !== "Limit") || (ev === "ENTRY" && mode !== "Market")) {
        fail("WF1 Event และ Mode ขัดกัน");
      }
    }

    const entry = num("Entry", info);
    const sl = num("SL", info);
    const tp = num("TP", info);
    if (!info && !(side === "BUY" ? sl! < entry! && entry! < tp! : tp! < entry! && entry! < sl!)) fail("WF1 ลำดับราคาไม่ถูกต้อง");

    const terminal = get("Terminal");
    if (terminal !== "true" && terminal !== "false") fail("WF1 Terminal ไม่ถูกต้อง");
    const isTerminal = terminal === "true";
    if (!info && ["TP", "SL", "CLOSE", "CANCEL", "EXPIRED"].includes(ev) && !isTerminal && !(ind === "SD" && ev === "TP")) {
      fail("WF1 สถานะปิดไม่ถูกต้อง");
    }

    let exit = num("Exit", true);
    if (exit === null && ev === "SL") exit = sl;
    if (exit === null && ev === "TP") {
      const level = ind === "SD" ? /:TP:(\d+)R$/.exec(eid) : null;
      exit = level && entry && sl ? entry + (side === "BUY" ? 1 : -1) * Math.abs(entry - sl) * Number.parseInt(level[1], 10) : tp;
    }
    // CLOSE without an explicit price stays unresolved financially; never substitute current quotes.

    const setupName = get("Setup Name");
    events.push({
      code: ind,
      indicator: INDICATOR_NAMES[ind],
      kind: info ? "info" : KINDS[ev],
      event: ev,
      mode,
      side,
      symbol: symbol.split(":").at(-1)!,
      feed_symbol: symbol,
      timeframe: tf,
      version,
      setup_id: sid,
      event_id: eid,
      entry,
      sl,
      tp,
      exit,
      terminal: isTerminal,
      identity_status: get("Identity Status"),
      observed_at: observed,
      bar_time: bar,
      setup: setupName || INDICATOR_NAMES[ind],
      seq: setupName || sid,
      key: "wf1:" + createHash("sha256").update(`${ind}|${sid}`).digest("hex"),
      contract: "WF1",
      ...reference,
    });
  }
  return events;
}
