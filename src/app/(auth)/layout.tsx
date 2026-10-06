import Link from "next/link";
import { ArrowLeft, ChartNoAxesCombined, Check } from "lucide-react";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-dvh bg-panel lg:grid-cols-2">
    <section className="surface-dark relative hidden flex-col justify-between overflow-hidden bg-[#17191c] p-12 lg:flex xl:p-16">
      <Link href="/" className="w-fit" aria-label="หน้าแรก"><Logo /></Link>
      <div className="relative py-16"><span className="mb-8 grid size-16 place-items-center rounded-2xl border border-white/15"><ChartNoAxesCombined className="size-8 text-accent" strokeWidth={1.3} /></span><p className="eyebrow">พื้นที่ทำงาน 1SHOT ของคุณ</p><h2 className="mt-5 text-4xl font-semibold leading-relaxed">ทุกเครื่องมือการเทรด<br />ในบัญชีเดียวของคุณ</h2><ul className="mt-8 space-y-4 text-sm text-muted">{["เลือกซื้อและต่ออายุ Indicator", "ตรวจสอบสิทธิ์และประวัติการชำระเงิน", "ติดตามสัญญาณผ่านเว็บและ Telegram"].map((t) => <li key={t} className="flex items-center gap-3"><Check className="size-4 text-accent" />{t}</li>)}</ul></div>
      <p className="text-xs text-faint">1SHOT · เครื่องมือสำหรับการเทรดอย่างมีแผน</p>
    </section>
    <div className="flex min-h-dvh flex-col px-6 py-8 sm:px-12"><Link href="/" className="flex w-fit items-center gap-2 text-xs text-muted hover:text-accent"><ArrowLeft className="size-4" /> กลับหน้าร้าน</Link><div className="mx-auto my-auto w-full max-w-sm py-12"><Link href="/" className="mb-10 block w-fit lg:hidden" aria-label="หน้าแรก"><Logo tone="auto" /></Link>{children}</div><p className="text-center text-xs text-faint">บัญชีของคุณ · สิทธิ์การใช้งานของคุณ</p></div>
  </main>;
}
