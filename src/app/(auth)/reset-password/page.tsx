import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RESET_COOKIE } from "@/lib/auth-reset";
import { getViewer } from "@/lib/auth";
import { setNewPassword } from "../actions";
import { PasswordForm } from "../auth-form";

export const metadata = { title: "ตั้งรหัสผ่านใหม่" };

/** Reached only from a password-reset email link (via /auth/confirm, which signs the user in). */
export default async function ResetPasswordPage() {
  const [viewer, jar] = await Promise.all([getViewer(), cookies()]);
  if (!viewer || !jar.get(RESET_COOKIE)) redirect("/forgot-password?error=expired");
  return (
    <>
      <h1 className="text-xl font-semibold">ตั้งรหัสผ่านใหม่</h1>
      <p className="mt-1 mb-6 text-sm text-muted">สำหรับ {viewer.profile.email}</p>
      <PasswordForm action={setNewPassword} email={viewer.profile.email} submit="บันทึกรหัสผ่านใหม่" />
    </>
  );
}
