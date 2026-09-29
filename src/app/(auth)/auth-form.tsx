"use client";
import { useActionState } from "react";
import { Button, Field, Input, Notice } from "@/components/ui";
import type { AuthState } from "./actions";

export function AuthForm({
  action, mode, next,
}: { action: (s: AuthState, f: FormData) => Promise<AuthState>; mode: "login" | "signup"; next?: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  if (state.message) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "signup" && (
        <Field label="ชื่อที่แสดง">
          <Input name="display_name" autoComplete="nickname" required maxLength={60} />
        </Field>
      )}
      <Field label="อีเมล">
        <Input name="email" type="email" autoComplete="email" required defaultValue={state.email} />
      </Field>
      <Field label="รหัสผ่าน" hint={mode === "signup" ? "อย่างน้อย 10 ตัวอักษร" : undefined}>
        <Input name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 10 : undefined} />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "กำลังดำเนินการ…" : mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}
      </Button>
    </form>
  );
}
