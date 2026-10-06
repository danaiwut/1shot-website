"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Button, Field, Input, Notice } from "@/components/ui";
import { resendConfirmation, signInWithGoogle, type AuthState } from "./actions";

type Action = (s: AuthState, f: FormData) => Promise<AuthState>;

export function AuthForm({ action, mode, next }: { action: Action; mode: "login" | "signup"; next?: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  if (state.message) return <Notice tone="success">{state.message}</Notice>;
  return (
    <div className="space-y-4">
      <GoogleButton next={next} label={mode === "login" ? "เข้าสู่ระบบด้วย Google" : "สมัครด้วย Google"} />
      <div className="flex items-center gap-3 text-xs text-muted" role="separator" aria-label="หรือใช้อีเมล">
        <span aria-hidden className="h-px flex-1 bg-line" />
        <span aria-hidden>หรือใช้อีเมล</span>
        <span aria-hidden className="h-px flex-1 bg-line" />
      </div>
      <form action={formAction} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        {mode === "signup" && (
          <Field label="ชื่อที่แสดง" required>
            <Input name="display_name" autoComplete="nickname" required maxLength={60} />
          </Field>
        )}
        <Field label="อีเมล" required>
          <Input name="email" type="email" autoComplete="email" required defaultValue={state.email} />
        </Field>
        <div className="space-y-1.5">
          <Field label="รหัสผ่าน" required hint={mode === "signup" ? "อย่างน้อย 10 ตัวอักษร" : undefined}>
            <Input
              name="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={mode === "signup" ? 10 : undefined}
              maxLength={72}
            />
          </Field>
          {mode === "login" && (
            <p className="text-right text-xs">
              <Link href="/forgot-password" className="text-accent underline underline-offset-4">ลืมรหัสผ่าน?</Link>
            </p>
          )}
        </div>
        {state.error && <Notice tone="error">{state.error}</Notice>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "กำลังดำเนินการ…" : mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}
        </Button>
      </form>
      {state.unconfirmed && state.email && <ResendConfirmation email={state.email} />}
    </div>
  );
}

/** Google sign-in through Supabase OAuth. The server action redirects to Google. */
export function GoogleButton({ next, label = "ดำเนินการต่อด้วย Google" }: { next?: string; label?: string }) {
  const [state, action, pending] = useActionState(signInWithGoogle, {});
  return (
    <form action={action} className="space-y-2">
      {next && <input type="hidden" name="next" value={next} />}
      <Button type="submit" variant="outline" className="h-12 w-full gap-3 text-base" disabled={pending}>
        <svg aria-hidden viewBox="0 0 48 48" className="size-5 shrink-0">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {pending ? "กำลังไปที่ Google…" : label}
      </Button>
      {state.error && <Notice tone="error">{state.error}</Notice>}
    </form>
  );
}

function ResendConfirmation({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendConfirmation, {});
  if (state.message) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="email" value={email} />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Button type="submit" variant="outline" className="w-full" disabled={pending}>
        {pending ? "กำลังส่ง…" : "ส่งลิงก์ยืนยันอีกครั้ง"}
      </Button>
    </form>
  );
}

/** Email-only form (forgot password). */
export function EmailForm({ action, submit }: { action: Action; submit: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  if (state.message) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={formAction} className="space-y-4">
      <Field label="อีเมล" required>
        <Input name="email" type="email" autoComplete="email" required defaultValue={state.email} />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "กำลังส่ง…" : submit}</Button>
    </form>
  );
}

/** New password + confirmation; `withCurrent` also asks for the current password (signed-in change). */
export function PasswordForm({ action, email, withCurrent = false, submit }: { action: Action; email: string; withCurrent?: boolean; submit: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      {/* Lets password managers attach the new password to the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} hidden readOnly />
      {withCurrent && (
        <Field label="รหัสผ่านปัจจุบัน" required>
          <Input name="current" type="password" autoComplete="current-password" required />
        </Field>
      )}
      <Field label="รหัสผ่านใหม่" required hint="อย่างน้อย 10 ตัวอักษร">
        <Input name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={72} />
      </Field>
      <Field label="ยืนยันรหัสผ่านใหม่" required>
        <Input name="confirm" type="password" autoComplete="new-password" required minLength={10} maxLength={72} />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.message && <Notice tone="success">{state.message}</Notice>}
      <Button type="submit" className={withCurrent ? undefined : "w-full"} disabled={pending}>{pending ? "กำลังบันทึก…" : submit}</Button>
    </form>
  );
}
