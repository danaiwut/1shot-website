"use client";
import { useActionState, useState, useTransition, type ReactNode } from "react";
import { CalendarClock, CalendarDays, Check, Clock, Infinity as Forever, PenLine, X } from "lucide-react";
import { ChoiceTiles, FormLayout, Panel, PickTile, Step } from "@/components/app/form-kit";
import { Button, cx, Field, Input, Notice } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { checkTradingViewName } from "@/lib/store/actions";
import { grantRights, type GrantState } from "../rights/actions";

type Duration = "30" | "90" | "365" | "lifetime" | "custom";
const DURATIONS: { value: Duration; title: string; line: string; icon: typeof Clock }[] = [
  { value: "30", title: "1 เดือน", line: "30 วัน", icon: Clock },
  { value: "90", title: "3 เดือน", line: "90 วัน", icon: Clock },
  { value: "365", title: "1 ปี", line: "365 วัน", icon: CalendarDays },
  { value: "lifetime", title: "ตลอดชีพ", line: "ไม่มีวันหมด", icon: Forever },
  { value: "custom", title: "กำหนดเอง", line: "จำนวนวัน / วันที่", icon: PenLine },
];

/** `status` is an optional short line under the name (e.g. the member's current expiry). */
export type GrantIndicator = { code: string; name: string; status?: string };

const split = (who: string) => [...new Set(who.split(/[\s,;]+/).map((x) => x.trim().replace(/^@/, "")).filter(Boolean))];

/**
 * Give or extend indicator rights (server action `grantRights`), as numbered steps with a sticky summary on the right.
 *   - no `member`: step 1 asks who — TradingView usernames or emails, several at once. Usernames without
 *     a web account become username-only grants (tradingview_grants). Used on /admin/rights.
 *   - `member`: the member is fixed (sent as `user_id`), only indicators + duration. Used on the member page.
 * `extra` renders under the submit button in the right-hand panel.
 */
export function GrantForm({ indicators, who: initial = "", member, extra }: {
  indicators: GrantIndicator[];
  who?: string;
  member?: { id: string; label: string };
  extra?: ReactNode;
}) {
  const [state, action, pending] = useActionState<GrantState, FormData>(grantRights, {});
  const [codes, setCodes] = useState<string[]>([]);
  const [duration, setDuration] = useState<Duration>("30");
  const [custom, setCustom] = useState<"days" | "until">("days");
  const [days, setDays] = useState("30");
  const [until, setUntil] = useState("");
  const [note, setNote] = useState("");
  const [who, setWho] = useState(initial);
  const names = member ? [] : split(who);
  const people = member ? 1 : new Set(names.map((n) => n.toLowerCase())).size;
  const [checks, setChecks] = useState<{ name: string; ok: boolean; message: string }[]>([]);
  const [checking, startCheck] = useTransition();
  const check = () => {
    const tv = names.filter((x) => !x.includes("@")).slice(0, 10);
    if (!tv.length) return setChecks([]);
    startCheck(async () => setChecks(await Promise.all(tv.map(async (name) => ({ name, ...(await checkTradingViewName(name)) })))));
  };
  const all = codes.length === indicators.length;
  const mode = duration === "lifetime" ? "lifetime" : duration === "custom" ? custom : "days";
  const term = duration !== "custom"
    ? DURATIONS.find((d) => d.value === duration)!.title
    : custom === "days" ? `${Number(days) || "?"} วัน` : until ? `ถึง ${new Date(`${until}T00:00:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}` : "ยังไม่เลือกวัน";
  const step = member ? 0 : 1;
  const chosen = indicators.filter((i) => codes.includes(i.code));
  const blocker = !people ? "ใส่ชื่อผู้ใช้ TradingView ก่อน" : !codes.length ? "เลือกอินดิเคเตอร์อย่างน้อย 1 ตัว" : null;

  const aside = (
    <>
      <Panel title="สรุปการให้สิทธิ์">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-xs text-muted">ให้ใคร</dt>
            <dd className="mt-1">
              {member ? <span className="font-bold">{member.label}</span>
                : names.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {names.slice(0, 8).map((n) => <span key={n} className="num rounded-full bg-panel-3 px-2.5 py-0.5 text-xs font-semibold">{n}</span>)}
                    {names.length > 8 && <span className="rounded-full bg-panel-3 px-2.5 py-0.5 text-xs text-muted">+{names.length - 8}</span>}
                  </span>
                ) : <span className="text-faint">ยังไม่ได้ใส่ชื่อ</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">อินดิเคเตอร์ {codes.length > 0 && <span className="tabular-nums">({codes.length})</span>}</dt>
            <dd className="mt-1">
              {chosen.length ? (
                <span className="flex flex-wrap gap-1.5">
                  {chosen.map((i) => <span key={i.code} title={i.name} className="num rounded-full bg-brand-dim px-2.5 py-0.5 text-xs font-bold text-accent">{i.code}</span>)}
                </span>
              ) : <span className="text-faint">ยังไม่ได้เลือก</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">ใช้ได้</dt>
            <dd className="mt-1 text-base font-bold">{term}</dd>
          </div>
          {note.trim() && (
            <div>
              <dt className="text-xs text-muted">หมายเหตุ</dt>
              <dd className="mt-1 break-words">{note}</dd>
            </div>
          )}
        </dl>
        {!blocker && (
          <p className="mt-4 rounded-xl bg-panel-2 px-3 py-2.5 text-sm font-semibold" aria-live="polite">
            ให้ {codes.length} ตัว แก่{member ? ` ${member.label}` : `ลูกค้า ${people} คน`}
          </p>
        )}
      </Panel>

      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      {state.missing && state.missing.length > 0 && <Notice tone="error">ให้ไม่ได้: {state.missing.join(", ")}</Notice>}

      <Button type="submit" disabled={pending || Boolean(blocker)} className="h-12 w-full rounded-full text-base font-semibold">
        {pending ? "กำลังให้สิทธิ์…" : "ให้สิทธิ์"}
      </Button>
      {blocker && <p className="text-center text-sm text-muted" aria-live="polite">{blocker}</p>}
      {extra}
    </>
  );

  return (
    <form action={action}>
      <input type="hidden" name="mode" value={mode} />
      {duration !== "custom" && duration !== "lifetime" && <input type="hidden" name="days" value={duration} />}
      {member && <input type="hidden" name="user_id" value={member.id} />}

      <FormLayout aside={aside}>
        {!member && (
          <Step n={1} title="ให้ใคร" hint="ชื่อผู้ใช้ TradingView บรรทัดละ 1 ชื่อ ใส่อีเมลแทนก็ได้ · ยังไม่มีบัญชีเว็บก็ให้ได้">
            <Field label="ชื่อผู้ใช้ TradingView" required>
              <Textarea
                name="who" rows={3} required value={who} onChange={(e) => setWho(e.target.value)} onBlur={check}
                autoComplete="off" spellCheck={false} className="num field-sizing-content min-h-20 bg-panel text-base placeholder:text-faint" placeholder={"somchai_fx\nnida.trader"}
              />
            </Field>
            {(checking || checks.length > 0) && (
              <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2 2xl:grid-cols-3" aria-live="polite">
                {checking ? <li className="text-muted">กำลังเช็คกับ TradingView…</li> : checks.map((c) => (
                  <li key={c.name} className={cx("flex items-center gap-2 rounded-lg px-3 py-2", c.ok ? "bg-buy-dim text-buy" : c.message.startsWith("ไม่พบ") ? "bg-sell-dim text-sell" : "bg-panel-2 text-muted")}>
                    {c.ok ? <Check aria-hidden className="size-4 shrink-0" /> : <X aria-hidden className="size-4 shrink-0" />}
                    <span className="num font-semibold">{c.name}</span> <span className="truncate">{c.ok ? "มีใน TradingView" : c.message}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm text-muted">สิทธิ์ของคนที่ยังไม่มีบัญชีจะย้ายเข้าบัญชีเองเมื่อเขาสมัครและใส่ชื่อนี้</p>
          </Step>
        )}

        <Step
          n={step + 1}
          title="อินดิเคเตอร์"
          aside={
            <button type="button" onClick={() => setCodes(all ? [] : indicators.map((i) => i.code))} className="inline-flex min-h-9 items-center rounded-full border border-line-strong px-4 text-sm font-medium hover:border-fg">
              {all ? "ไม่เลือกทั้งหมด" : "เลือกทั้งหมด"}
            </button>
          }
        >
          <fieldset>
            <legend className="sr-only">อินดิเคเตอร์ที่จะให้</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {indicators.map((i) => {
                const on = codes.includes(i.code);
                return (
                  <PickTile
                    key={i.code} name="codes" value={i.code} checked={on} title={i.name} code={i.code} line={i.status}
                    onChange={() => setCodes((c) => (on ? c.filter((x) => x !== i.code) : [...c, i.code]))}
                  />
                );
              })}
            </div>
          </fieldset>
        </Step>

        <Step n={step + 2} title="ใช้ได้นานเท่าไร" hint={duration !== "lifetime" ? "มีสิทธิ์อยู่แล้ว = ต่อจากวันหมดอายุเดิม (ยกเว้นเลือกวันหมดอายุเอง)" : undefined}>
          <ChoiceTiles name="duration" label="ระยะเวลา" value={duration} onChange={setDuration} options={DURATIONS} columns="grid-cols-2 sm:grid-cols-3 2xl:grid-cols-5" />
          {duration === "custom" && (
            <div className="mt-4 grid gap-4 rounded-xl bg-panel-2 p-4 sm:grid-cols-2">
              <ChoiceTiles
                name="custom_mode" label="แบบกำหนดเอง" value={custom} onChange={setCustom} columns="grid-cols-2 sm:col-span-2"
                options={[{ value: "days", title: "ใส่จำนวนวัน", icon: Clock }, { value: "until", title: "เลือกวันหมดอายุ", icon: CalendarClock }]}
              />
              {custom === "days"
                ? <Field label="จำนวนวัน"><Input type="number" name="days" min={1} max={3650} value={days} onChange={(e) => setDays(e.target.value)} className="num" placeholder="45" /></Field>
                : <Field label="หมดอายุวันที่" hint="ใช้วันนี้เป็นวันหมดอายุเลย ย่นวันได้ด้วย"><Input type="date" name="until" required value={until} onChange={(e) => setUntil(e.target.value)} /></Field>}
            </div>
          )}
        </Step>

        <Step n={step + 3} title="หมายเหตุ" hint="ไม่ต้องใส่ก็ได้ เห็นเฉพาะทีมงาน">
          <Field label="หมายเหตุ"><Input name="note" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ลูกค้า IB เดือนนี้ หรือชดเชยระบบล่ม" /></Field>
        </Step>
      </FormLayout>
    </form>
  );
}
