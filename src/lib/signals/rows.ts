import { parseWf1, type ParsedSignalEvent } from "../domain/wf1";
import { splitShapes } from "../domain/shapes";

// Same comparable fields as wf_contract.record, so a replayed Event ID with different data is rejected.
function comparableBody(e: ParsedSignalEvent) {
  const body: Record<string, unknown> = {};
  for (const k of ["setup_id", "event", "mode", "side", "feed_symbol", "timeframe", "version", "entry", "sl", "tp", "exit", "terminal"] as const) {
    body[k] = e[k] ?? null;
  }
  if (e.code === "LV") Object.assign(body, { levels: e.levels, bar_time: e.bar_time, day_close: e.day_close, feed_timezone: e.feed_timezone });
  return body;
}

/** Alert text → rows for `ingest_signal_events`. Throws Wf1Error on malformed WF1. */
export function alertToRows(text: string, nowSeconds?: number) {
  const [clean, shapes] = splitShapes(text);
  return parseWf1(clean, nowSeconds).map((e) => ({
    code: e.code,
    indicator: e.indicator,
    kind: e.kind,
    event: e.event,
    mode: e.mode ?? null,
    side: e.side ?? null,
    symbol: e.symbol,
    feed_symbol: e.feed_symbol,
    timeframe: e.timeframe,
    version: e.version,
    setup_id: e.setup_id,
    event_id: e.event_id,
    setup_key: e.key,
    setup_name: e.setup,
    entry: e.entry,
    sl: e.sl,
    tp: e.tp,
    exit_price: e.exit,
    terminal: e.terminal,
    identity_status: e.identity_status ?? null,
    observed_at: e.observed_at,
    bar_time: e.bar_time,
    shapes,
    reference: e.levels ? { levels: e.levels, day_close: e.day_close, feed_timezone: e.feed_timezone } : null,
    body: comparableBody(e),
  }));
}
