"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { LifeBuoy, SendHorizontal, Send, CandlestickChart } from "lucide-react";
import { ChoiceTiles, PickTile, Step, SubmitButton } from "@/components/app/form-kit";
import { cx } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { openRequest, replyRequest, type SupportState } from "./actions";

const textarea = "min-h-28 bg-panel text-fg placeholder:text-faint focus-visible:border-brand/70 dark:bg-panel";
type Kind = "rights" | "room" | "help";

const KINDS = [
  { value: "rights", title: "สิทธิ์ 1Shot Indicators", line: "ขอสิทธิ์ / ต่ออายุ / สิทธิ์ไม่ขึ้น", icon: CandlestickChart },
  { value: "room", title: "ห้องสมาชิก", line: "เข้าห้อง Telegram ไม่ได้", icon: Send },
  { value: "help", title: "ความช่วยเหลืออื่น ๆ", line: "สอบถามทีมงาน", icon: LifeBuoy },
] as const;

/** New request as numbered steps: topic tiles → indicator (optional) → details. */
export function NewRequestForm({ indicators, defaultKind, defaultCode }: { indicators: { code: string; name: string }[]; defaultKind?: string; defaultCode?: string }) {
  const [state, action, pending] = useActionState<SupportState, FormData>(openRequest, {});
  const [kind, setKind] = useState<Kind>(KINDS.some((k) => k.value === defaultKind) ? (defaultKind as Kind) : "rights");
  const [code, setCode] = useState(defaultCode && indicators.some((i) => i.code === defaultCode) ? defaultCode : "");
  const withCode = kind !== "help";
  return (
    <form action={action} className="space-y-6" noValidate>
      <Step n={1} title="เรื่องที่ต้องการให้ช่วย">
        <ChoiceTiles name="kind" label="ประเภทคำขอ" value={kind} onChange={setKind} options={[...KINDS]} columns="md:grid-cols-3" />
      </Step>

      {withCode && (
        <Step n={2} title="อินดิเคเตอร์ที่เกี่ยวข้อง" hint="ไม่บังคับ เลือกเพื่อให้ทีมงานตรวจได้เร็วขึ้น">
          <div role="radiogroup" aria-label="อินดิเคเตอร์ที่เกี่ยวข้อง" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            <PickTile type="radio" name="indicator_code" value="" checked={!code} onChange={() => setCode("")} title="ไม่ระบุ" line="หลายตัว หรือไม่แน่ใจ" />
            {indicators.map((i) => (
              <PickTile key={i.code} type="radio" name="indicator_code" value={i.code} checked={code === i.code} onChange={() => setCode(i.code)} title={i.name} code={i.code} />
            ))}
          </div>
        </Step>
      )}

      <Step n={withCode ? 3 : 2} title="รายละเอียด" hint="บอกสิ่งที่ต้องการให้ทีมงานช่วยตรวจสอบ เช่น ชื่อผู้ใช้ TradingView หรือวันที่ชำระเงิน">
        <label htmlFor="support-message" className="sr-only">รายละเอียด</label>
        <Textarea
          id="support-message" name="message" required minLength={5} maxLength={4000} rows={6} placeholder="เล่าให้ทีมงานฟัง…"
          className={cx(textarea, "rounded-xl text-base")} aria-invalid={Boolean(state.error)} aria-describedby={state.error ? "support-error" : undefined}
        />
        {state.error && <p id="support-error" role="alert" className="mt-2 text-sm text-sell">{state.error}</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">ทีมงานจะตอบกลับในหน้านี้ และสถานะจะเปลี่ยนเป็น “ทีมงานตอบแล้ว”</p>
          <SubmitButton pending={pending} pendingText="กำลังส่ง…" className="sm:w-auto sm:min-w-48"><SendHorizontal aria-hidden className="size-4" />ส่งคำขอ</SubmitButton>
        </div>
      </Step>
    </form>
  );
}

/** Chat composer at the bottom of a thread; clears itself after sending. Ctrl/⌘ + Enter sends. */
export function ReplyForm({ requestId, action = replyRequest, label = "ตอบกลับทีมงาน" }: {
  requestId: string; action?: (s: SupportState, f: FormData) => Promise<SupportState>; label?: string;
}) {
  const [state, run, pending] = useActionState<SupportState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  const id = `reply-${requestId}`;
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={run} className="grid gap-2">
      <input type="hidden" name="request_id" value={requestId} />
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <div className={cx(
        "flex items-end gap-2 rounded-2xl border bg-panel p-2 pl-3 transition-colors focus-within:border-brand/70 focus-within:ring-[3px] focus-within:ring-ring/40",
        state.error ? "border-sell" : "border-line-strong",
      )}>
        <Textarea
          id={id} name="body" required maxLength={4000} rows={2} placeholder="พิมพ์ข้อความ…"
          className="max-h-60 min-h-12 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
          aria-invalid={Boolean(state.error)} aria-describedby={state.error ? `${id}-error` : undefined}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ref.current?.requestSubmit(); } }}
        />
        <button
          type="submit" disabled={pending} aria-label={pending ? "กำลังส่ง…" : "ส่งข้อความ"}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60 sm:px-5"
        >
          <SendHorizontal aria-hidden className="size-4" /><span className="hidden sm:inline">{pending ? "กำลังส่ง…" : "ส่ง"}</span>
        </button>
      </div>
      <div className="flex min-h-5 flex-wrap items-center justify-between gap-3 px-1 text-xs">
        {state.error ? <span id={`${id}-error`} role="alert" className="text-sm text-sell">{state.error}</span> : <span className="hidden text-faint sm:block">Ctrl / ⌘ + Enter เพื่อส่ง</span>}
        {state.ok && <span role="status" className="text-sm font-medium text-buy">{state.ok}</span>}
      </div>
    </form>
  );
}
