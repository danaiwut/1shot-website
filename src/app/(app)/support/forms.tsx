"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button, Field, Notice, Select } from "@/components/ui";
import { openRequest, replyRequest, type SupportState } from "./actions";

const textarea = "w-full rounded-lg border border-line-strong bg-panel px-3 py-2.5 text-base text-fg placeholder:text-faint focus:border-brand focus:outline-none";

export function NewRequestForm({ indicators, defaultKind, defaultCode }: { indicators: { code: string; name: string }[]; defaultKind?: string; defaultCode?: string }) {
  const [state, action, pending] = useActionState<SupportState, FormData>(openRequest, {});
  const [kind, setKind] = useState(defaultKind ?? "rights");
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="ประเภทคำขอ">
        <Select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="rights">สิทธิ์ 1Shot Indicators (ขอสิทธิ์ / ต่ออายุ / สิทธิ์ไม่ขึ้น)</option>
          <option value="room">ห้องสมาชิก (เข้าห้อง Telegram ไม่ได้)</option>
          <option value="help">ความช่วยเหลืออื่น ๆ</option>
        </Select>
      </Field>
      {kind !== "help" && (
        <Field label="1Shot Indicators ที่เกี่ยวข้อง" hint="ไม่บังคับ">
          <Select name="indicator_code" defaultValue={defaultCode ?? ""}>
            <option value="">— ไม่ระบุ —</option>
            {indicators.map((i) => <option key={i.code} value={i.code}>{i.name} ({i.code})</option>)}
          </Select>
        </Field>
      )}
      <Field label="รายละเอียด" hint="บอกสิ่งที่ต้องการให้ทีมงานช่วยตรวจสอบ เช่น ชื่อผู้ใช้ TradingView หรือวันที่ชำระเงิน" error={state.error}>
        <textarea name="message" required minLength={5} maxLength={4000} rows={5} className={textarea} aria-invalid={Boolean(state.error)} />
      </Field>
      <Button type="submit" disabled={pending} className="h-12 w-full px-6 text-base sm:w-auto">
        <Send aria-hidden className="size-4" /> {pending ? "กำลังส่ง…" : "ส่งคำขอ"}
      </Button>
    </form>
  );
}

/** Reply box at the bottom of a thread; clears itself after sending. */
export function ReplyForm({ requestId, action = replyRequest, label = "ตอบกลับทีมงาน" }: {
  requestId: string; action?: (s: SupportState, f: FormData) => Promise<SupportState>; label?: string;
}) {
  const [state, run, pending] = useActionState<SupportState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={run} className="space-y-3">
      <input type="hidden" name="request_id" value={requestId} />
      <Field label={label} error={state.error}>
        <textarea name="body" required maxLength={4000} rows={3} className={textarea} aria-invalid={Boolean(state.error)} />
      </Field>
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <Button type="submit" disabled={pending}><Send aria-hidden className="size-4" /> {pending ? "กำลังส่ง…" : "ส่งข้อความ"}</Button>
    </form>
  );
}
