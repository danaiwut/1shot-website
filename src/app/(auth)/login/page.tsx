import Link from "next/link";
import { DEMO_ACCOUNTS } from "@/lib/mock/seed";
import { isMockMode } from "@/lib/mock/mode";
import { demoLogin, login } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="text-xl font-semibold">เข้าสู่ระบบ</h1>
      <p className="mt-1 mb-6 text-sm text-muted">ยินดีต้อนรับกลับ</p>
      {error === "confirm" && <p className="mb-4 text-sm text-sell">ลิงก์ยืนยันหมดอายุหรือไม่ถูกต้อง</p>}
      {isMockMode() && (
        <div className="mb-6 space-y-2 rounded-2xl border border-brand/20 bg-brand-dim p-3">
          <p className="px-1 text-xs font-medium text-accent">โหมดตัวอย่าง · กดเพื่อเข้าด้วยบัญชีตัวอย่าง</p>
          {DEMO_ACCOUNTS.map((a) => (
            <form key={a.email} action={demoLogin}>
              <input type="hidden" name="email" value={a.email} />
              {typeof next === "string" && <input type="hidden" name="next" value={next} />}
              <button className="flex w-full items-center justify-between gap-3 rounded-xl bg-panel px-3 py-2.5 text-left shadow-sm transition hover:ring-1 hover:ring-brand/40">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{a.role === "owner" ? "เข้าเป็นแอดมิน" : "เข้าเป็นสมาชิก"}</span>
                  <span className="block text-[11px] leading-snug text-muted">{a.note}</span>
                  <span className="num mt-0.5 block truncate text-[10px] text-faint">{a.email}</span>
                </span>
                <span className="shrink-0 text-accent">→</span>
              </button>
            </form>
          ))}
          <p className="px-1 text-[11px] text-muted">หรือกรอกอีเมลและรหัสผ่านอะไรก็ได้ด้านล่าง</p>
        </div>
      )}
      <AuthForm action={login} mode="login" next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-sm text-muted">
        ยังไม่มีบัญชี? <Link href="/signup" className="text-accent hover:underline">สมัครสมาชิก</Link>
      </p>
    </>
  );
}
