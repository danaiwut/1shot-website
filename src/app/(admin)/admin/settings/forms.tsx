"use client";
import { useActionState } from "react";
import { SubmitButton } from "@/components/app/form-kit";
import { Field, Input, Notice } from "@/components/ui";
import { saveTvScripts, saveTvSession, type TvSettingsState } from "./actions";

/** Owner's TradingView session cookie (password fields, never shown back in full). */
export function SessionForm() {
  const [state, action, pending] = useActionState<TvSettingsState, FormData>(saveTvSession, {});
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="sessionid" required hint="ค่าจาก Cookies ของ tradingview.com หลังล็อกอินด้วยบัญชีเจ้าของสคริปต์">
          <Input name="sessionid" type="password" required autoComplete="off" spellCheck={false} className="num" placeholder="วางค่า sessionid" />
        </Field>
        <Field label="sessionid_sign (ถ้ามี)" hint="ถ้าใน Cookies มี sessionid_sign ให้วางด้วย ไม่มีก็เว้นว่างได้">
          <Input name="sessionid_sign" type="password" autoComplete="off" spellCheck={false} className="num" placeholder="วางค่า sessionid_sign (ถ้ามี)" />
        </Field>
      </div>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <SubmitButton pending={pending} className="sm:w-auto sm:px-8">บันทึก Session</SubmitButton>
    </form>
  );
}

/** One input per indicator, saved together. */
export function ScriptsForm({ rows }: { rows: { code: string; name: string; scriptId: string | null }[] }) {
  const [state, action, pending] = useActionState<TvSettingsState, FormData>(saveTvScripts, {});
  return (
    <form action={action} className="space-y-5">
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {rows.map((r) => (
          <li key={r.code} className="grid items-center gap-3 px-4 py-3.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-bold">{r.name} <span className="num ml-1 rounded-md border border-line bg-panel-2 px-1.5 py-0.5 text-xs text-muted">{r.code}</span></p>
            </div>
            <Input
              name={`script_${r.code}`} defaultValue={r.scriptId ?? ""} autoComplete="off" spellCheck={false} className="num"
              placeholder="PUB;xxxxxxxx" aria-label={`Script ID ของ ${r.name}`}
            />
          </li>
        ))}
      </ul>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <SubmitButton pending={pending} className="sm:w-auto sm:px-8">บันทึก Script ID</SubmitButton>
    </form>
  );
}
