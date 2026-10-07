"use client";
import { useActionState, useState, useTransition, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Button, cx, Field, Input, Notice } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { checkTradingViewName } from "@/lib/store/actions";
import { grantRights, markGrantSynced, markTvSynced, type GrantState } from "./actions";

const DURATIONS = [
  { key: "30", label: "1 เดือน" },
  { key: "90", label: "3 เดือน" },
  { key: "365", label: "1 ปี" },
  { key: "lifetime", label: "ตลอดชีพ" },
  { key: "custom", label: "กำหนดเอง" },
] as const;
type Duration = (typeof DURATIONS)[number]["key"];

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-line bg-panel p-5">
      <legend className="sr-only">{`ขั้นที่ ${n}: ${title}`}</legend>
      <p aria-hidden className="mb-4 flex items-center gap-3 text-base font-semibold">
        <span className="num grid size-8 place-items-center rounded-full bg-brand text-sm font-bold text-white">{n}</span>{title}
      </p>
      {children}
    </fieldset>
  );
}

/** Three steps: who, which indicators, how long. */
export function GrantForm({ indicators, who: initial = "" }: { indicators: { code: string; name: string }[]; who?: string }) {
  const [state, action, pending] = useActionState<GrantState, FormData>(grantRights, {});
  const [codes, setCodes] = useState<string[]>([]);
  const [duration, setDuration] = useState<Duration>("30");
  const [custom, setCustom] = useState<"days" | "until">("days");
  const [who, setWho] = useState(initial);
  const people = new Set(who.split(/[\s,;]+/).map((x) => x.trim().replace(/^@/, "").toLowerCase()).filter(Boolean)).size;
  const [checks, setChecks] = useState<{ name: string; ok: boolean; message: string }[]>([]);
  const [checking, startCheck] = useTransition();
  const check = () => {
    const names = [...new Set(who.split(/[\s,;]+/).map((x) => x.trim().replace(/^@/, "")).filter((x) => x && !x.includes("@")))].slice(0, 10);
    if (!names.length) return setChecks([]);
    startCheck(async () => setChecks(await Promise.all(names.map(async (name) => ({ name, ...(await checkTradingViewName(name)) })))));
  };
  const all = codes.length === indicators.length;
  const mode = duration === "lifetime" ? "lifetime" : duration === "custom" ? custom : "days";
  const label = DURATIONS.find((d) => d.key === duration)!.label;

  return (
    <form action={action} className="space-y-4">
      <Step n={1} title="ให้ใคร">
        <Field label="ชื่อผู้ใช้ TradingView" hint="หลายคนได้ ใส่บรรทัดละ 1 ชื่อ · ระบบเช็คกับ TradingView ให้ว่ามีชื่อนี้จริง" required>
          <Textarea
            name="who" rows={2} required value={who} onChange={(e) => setWho(e.target.value)} onBlur={check}
            autoComplete="off" spellCheck={false} className="num field-sizing-content min-h-12 bg-panel text-base" placeholder="เช่น somchai_fx"
          />
        </Field>
        {(checking || checks.length > 0) && (
          <ul className="mt-3 space-y-1 text-sm" aria-live="polite">
            {checking ? <li className="text-muted">กำลังเช็คกับ TradingView…</li> : checks.map((c) => (
              <li key={c.name} className={cx("flex items-center gap-2", c.ok ? "text-buy" : c.message.startsWith("ไม่พบ") ? "text-sell" : "text-muted")}>
                {c.ok ? <Check aria-hidden className="size-4" /> : <span aria-hidden className="w-4 text-center">!</span>}
                <span className="num font-medium">{c.name}</span> <span>{c.ok ? "มีใน TradingView" : c.message}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-muted">ลูกค้ายังไม่มีบัญชีเว็บก็ให้ได้ สิทธิ์จะย้ายเข้าบัญชีเองเมื่อเขาสมัครและใส่ชื่อนี้ (ใส่อีเมลแทนชื่อก็ได้)</p>
      </Step>

      <Step n={2} title="ให้อินดิเคเตอร์ตัวไหน">
        <button type="button" onClick={() => setCodes(all ? [] : indicators.map((i) => i.code))} className="mb-3 inline-flex min-h-11 items-center rounded-lg border border-line-strong px-4 text-sm font-medium hover:border-fg">
          {all ? "ไม่เลือกทั้งหมด" : "เลือกทั้งหมด"}
        </button>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {indicators.map((i) => {
            const on = codes.includes(i.code);
            return (
              <label key={i.code} className={cx("flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50", on ? "border-brand bg-brand-dim" : "border-line hover:border-line-strong")}>
                <input type="checkbox" name="codes" value={i.code} checked={on} onChange={() => setCodes((c) => (on ? c.filter((x) => x !== i.code) : [...c, i.code]))} className="size-5 accent-[var(--color-brand)]" />
                <span className="min-w-0 flex-1 truncate font-medium">{i.name}</span>
                <span className="num text-xs text-muted">{i.code}</span>
              </label>
            );
          })}
        </div>
      </Step>

      <Step n={3} title="ใช้ได้นานเท่าไร">
        <input type="hidden" name="mode" value={mode} />
        {duration !== "custom" && duration !== "lifetime" && <input type="hidden" name="days" value={duration} />}
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="ระยะเวลา">
          {DURATIONS.map((d) => (
            <button
              key={d.key} type="button" role="radio" aria-checked={duration === d.key} onClick={() => setDuration(d.key)}
              className={cx("min-h-12 min-w-24 rounded-lg border px-4 text-base font-medium transition-colors", duration === d.key ? "border-brand bg-brand text-white" : "border-line-strong hover:border-fg")}
            >
              {d.label}
            </button>
          ))}
        </div>
        {duration === "custom" && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {([["days", "ใส่จำนวนวัน"], ["until", "เลือกวันหมดอายุ"]] as const).map(([m, t]) => (
                <label key={m} className={cx("inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm", custom === m ? "border-fg bg-panel-3 font-semibold" : "border-line-strong")}>
                  <input type="radio" checked={custom === m} onChange={() => setCustom(m)} className="size-4 accent-[var(--color-brand)]" />{t}
                </label>
              ))}
            </div>
            <div className="max-w-xs">
              {custom === "days"
                ? <Field label="จำนวนวัน"><Input type="number" name="days" min={1} max={3650} defaultValue={30} className="num" /></Field>
                : <Field label="หมดอายุวันที่"><Input type="date" name="until" required /></Field>}
            </div>
          </div>
        )}
        {duration !== "lifetime" && <p className="mt-3 text-sm text-muted">ถ้าลูกค้ามีสิทธิ์อยู่แล้ว จะต่อเวลาจากวันหมดอายุเดิม</p>}
      </Step>

      <details className="rounded-xl border border-line bg-panel px-5 py-1 text-sm">
        <summary className="flex min-h-11 cursor-pointer items-center font-medium">เพิ่มหมายเหตุ (ไม่ต้องใส่ก็ได้)</summary>
        <div className="pb-4"><Field label="หมายเหตุ" hint="เช่น ลูกค้า IB หรือชดเชยระบบล่ม"><Input name="note" maxLength={200} /></Field></div>
      </details>

      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      {state.missing && state.missing.length > 0 && <Notice tone="error">ให้ไม่ได้: {state.missing.join(", ")}</Notice>}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending || !codes.length || !people} className="h-12 px-8 text-base">
          {pending ? "กำลังให้สิทธิ์…" : "ให้สิทธิ์"}
        </Button>
        <p className="text-sm text-muted" aria-live="polite">
          {!people ? "ใส่ชื่อผู้ใช้ TradingView ก่อน" : !codes.length ? "เลือกอินดิเคเตอร์อย่างน้อย 1 ตัว" : `ให้ ${codes.length} ตัว แก่ลูกค้า ${people} คน · ${label}`}
        </p>
      </div>
    </form>
  );
}

/** `userId` for a member's right, `username` for a grant to someone without an account. */
export function TvDoneButton({ userId, username, code, label }: { userId?: string; username?: string; code: string; label: string }) {
  const [busy, start] = useTransition();
  return (
    <Button type="button" variant="outline" disabled={busy} aria-label={`ทำเครื่องหมายว่าเปิด ${label} ใน TradingView แล้ว`} onClick={() => start(() => (userId ? markTvSynced(userId, code) : markGrantSynced(username!, code)))}>
      <Check aria-hidden className="size-4" /> {busy ? "กำลังบันทึก…" : "เปิดแล้ว"}
    </Button>
  );
}

export function CopyName({ name }: { name: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(name).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 font-mono text-sm hover:text-accent"
      aria-label={`คัดลอกชื่อ TradingView ${name}`}
    >
      {name} {done ? <Check aria-hidden className="size-3.5 text-buy" /> : <Copy aria-hidden className="size-3.5 text-muted" />}
      <span aria-live="polite" className="sr-only">{done ? "คัดลอกแล้ว" : ""}</span>
    </button>
  );
}
