import Link from "next/link";
import { signup } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata = { title: "สมัครสมาชิก" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-xl font-semibold">สร้างบัญชี</h1>
      <p className="mt-1 mb-6 text-sm text-muted">สมัครด้วย Google หรืออีเมล แล้วตั้งค่า TradingView, Exness และ Telegram ในหน้าบัญชี</p>
      <AuthForm action={signup} mode="signup" />
      <p className="mt-6 text-center text-sm text-muted">
        มีบัญชีแล้ว? <Link href="/login" className="text-accent underline underline-offset-4">เข้าสู่ระบบ</Link>
      </p>
    </>
  );
}
