import Link from "next/link";
import { Notice } from "@/components/ui";
import { login } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="text-xl font-semibold">เข้าสู่ระบบ</h1>
      <p className="mt-1 mb-6 text-sm text-muted">ยินดีต้อนรับกลับ</p>
      {error === "confirm" && <div className="mb-4"><Notice tone="error">ลิงก์ยืนยันหมดอายุหรือถูกใช้ไปแล้ว ลองเข้าสู่ระบบเพื่อขอลิงก์ใหม่</Notice></div>}
      {error === "oauth" && <div className="mb-4"><Notice tone="error">เข้าสู่ระบบด้วย Google ไม่สำเร็จหรือถูกยกเลิก กรุณาลองใหม่</Notice></div>}
      <AuthForm action={login} mode="login" next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-sm text-muted">
        ยังไม่มีบัญชี? <Link href="/signup" className="text-accent underline underline-offset-4">สมัครสมาชิก</Link>
      </p>
    </>
  );
}
