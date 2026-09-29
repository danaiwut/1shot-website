import Link from "next/link";
import { login } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="text-xl font-semibold">เข้าสู่ระบบ</h1>
      <p className="mt-1 mb-6 text-sm text-muted">ยินดีต้อนรับกลับ</p>
      {error === "confirm" && <p className="mb-4 text-sm text-sell">ลิงก์ยืนยันหมดอายุหรือไม่ถูกต้อง</p>}
      <AuthForm action={login} mode="login" next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-sm text-muted">
        ยังไม่มีบัญชี? <Link href="/signup" className="text-gold hover:underline">สมัครสมาชิก</Link>
      </p>
    </>
  );
}
