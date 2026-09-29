import Link from "next/link";
import { ButtonLink, Logo } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const viewer = isSupabaseConfigured() ? await getViewer() : null;
  return (
    <div className="relative">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="หน้าแรก"><Logo /></Link>
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#how" className="hover:text-fg">การทำงาน</a>
            <a href="#indicators" className="hover:text-fg">อินดิเคเตอร์</a>
            <a href="#guard" className="hover:text-fg">การคุมความเสี่ยง</a>
            <a href="#join" className="hover:text-fg">สมัครสมาชิก</a>
          </nav>
          <div className="flex items-center gap-2">
            {viewer ? (
              <ButtonLink href="/dashboard">เข้าสู่แดชบอร์ด</ButtonLink>
            ) : (
              <>
                <span className="hidden sm:block"><ButtonLink href="/login" variant="ghost">เข้าสู่ระบบ</ButtonLink></span>
                <ButtonLink href="/signup">สมัครสมาชิก</ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm text-muted sm:px-6 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-md text-xs leading-relaxed">
              การเทรดทองคำและ CFD มีความเสี่ยงสูง อาจสูญเสียเงินทุนทั้งหมด สัญญาณเป็นข้อมูลจากอินดิเคเตอร์ ไม่ใช่คำแนะนำการลงทุนเฉพาะบุคคล
              และผลในอดีตไม่ได้รับประกันผลในอนาคต
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-x-8 gap-y-2 md:justify-end">
            <Link href="/login" className="hover:text-fg">เข้าสู่ระบบ</Link>
            <Link href="/signup" className="hover:text-fg">สมัครสมาชิก</Link>
            <a href="#indicators" className="hover:text-fg">อินดิเคเตอร์</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
