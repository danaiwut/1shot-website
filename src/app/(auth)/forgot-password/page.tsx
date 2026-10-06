import Link from "next/link";
import { Notice } from "@/components/ui";
import { requestPasswordReset } from "../actions";
import { EmailForm } from "../auth-form";

export const metadata = { title: "ลืมรหัสผ่าน" };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const { error } = await searchParams;
  return (
    <>
      <h1 className="text-xl font-semibold">ลืมรหัสผ่าน</h1>
      <p className="mt-1 mb-6 text-sm text-muted">กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้</p>
      {error === "expired" && <div className="mb-4"><Notice tone="error">ลิงก์ตั้งรหัสผ่านหมดอายุหรือถูกใช้ไปแล้ว กรุณาขอลิงก์ใหม่ และเปิดลิงก์ในเบราว์เซอร์เดียวกับที่ขอ</Notice></div>}
      <EmailForm action={requestPasswordReset} submit="ส่งลิงก์ตั้งรหัสผ่านใหม่" />
      <p className="mt-6 text-center text-sm text-muted">
        นึกออกแล้ว? <Link href="/login" className="text-accent underline underline-offset-4">กลับไปเข้าสู่ระบบ</Link>
      </p>
    </>
  );
}
