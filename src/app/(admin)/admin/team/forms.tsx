"use client";
import { useActionState, useEffect, useRef } from "react";
import { Button, Field, Input, Notice } from "@/components/ui";
import { changeTeamRole, type TeamState } from "./actions";

export function AddAdminForm() {
  const [state, action, pending] = useActionState<TeamState, FormData>(changeTeamRole, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-4">
      <input type="hidden" name="role" value="admin" />
      <Field label="อีเมลของบัญชีที่สมัครแล้ว" required><Input name="email" type="email" required autoComplete="off" /></Field>
      <Field label="เหตุผล" hint="บันทึกไว้ในประวัติการจัดการสิทธิ์" required><Input name="reason" required minLength={3} maxLength={300} /></Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <Button type="submit" disabled={pending}>{pending ? "กำลังบันทึก…" : "เพิ่มเป็นแอดมิน"}</Button>
    </form>
  );
}

export function RemoveAdminForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<TeamState, FormData>(changeTeamRole, {});
  return (
    <details className="mt-3">
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-sell underline-offset-4 hover:underline">ถอดออกจากทีมงาน</summary>
      <form action={action} className="mt-2 space-y-3 rounded-lg border border-line bg-panel-2 p-4">
        <input type="hidden" name="role" value="member" />
        <input type="hidden" name="email" value={email} />
        <Field label="เหตุผลที่ถอดสิทธิ์แอดมิน" required><Input name="reason" required minLength={3} maxLength={300} /></Field>
        {state.error && <Notice tone="error">{state.error}</Notice>}
        <Button type="submit" variant="danger" disabled={pending}>{pending ? "กำลังบันทึก…" : "ยืนยันถอดสิทธิ์"}</Button>
      </form>
    </details>
  );
}
