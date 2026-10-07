"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button, cx, Field, Notice, Select } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { openRequest, replyRequest, type SupportState } from "./actions";

const textarea = "min-h-28 bg-panel text-fg placeholder:text-faint focus-visible:border-brand/70 dark:bg-panel";

export function NewRequestForm({ indicators, defaultKind, defaultCode }: { indicators: { code: string; name: string }[]; defaultKind?: string; defaultCode?: string }) {
  const [state, action, pending] = useActionState<SupportState, FormData>(openRequest, {});
  const [kind, setKind] = useState(defaultKind ?? "rights");
  return (
    <form action={action} className="grid gap-4" noValidate>
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
        <Textarea name="message" required minLength={5} maxLength={4000} rows={5} className={textarea} aria-invalid={Boolean(state.error)} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "กำลังส่ง…" : "ส่งคำขอ"}
        </Button>
      </div>
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
    <form ref={ref} action={run} className="grid gap-3">
      <input type="hidden" name="request_id" value={requestId} />
      <Field label={label} error={state.error}>
        <Textarea name="body" required maxLength={4000} rows={3} className={cx(textarea, "min-h-20")} aria-invalid={Boolean(state.error)} />
      </Field>
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? "กำลังส่ง…" : "ส่งข้อความ"}</Button>
      </div>
    </form>
  );
}
