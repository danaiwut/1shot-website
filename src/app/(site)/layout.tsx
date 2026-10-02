import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteMobileMenu } from "@/components/site/mobile-menu";
import { SiteNavLinks } from "@/components/site/nav-links";
import { ButtonLink, Logo } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { hasBackend } from "@/lib/env";

const NAV = [
  { href: "/#indicators", label: "อินดิเคเตอร์" },
  { href: "/pricing", label: "ราคา" },
  { href: "/#guard", label: "การคุมความเสี่ยง" },
  { href: "/#how", label: "การทำงาน" },
  { href: "/#about", label: "เกี่ยวกับเรา" },
];

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const viewer = hasBackend() ? await getViewer() : null;
  return (
    <div className="relative">
      <header className="surface-dark sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/" aria-label="หน้าแรก"><Logo /></Link>
          <SiteNavLinks links={NAV} />
          <div className="flex items-center gap-2">
            {viewer ? (
              <ButtonLink href="/dashboard">เข้าสู่แดชบอร์ด <ArrowRight className="size-4" /></ButtonLink>
            ) : (
              <>
                <span className="hidden sm:block"><ButtonLink href="/login" variant="ghost">เข้าสู่ระบบ</ButtonLink></span>
                <span className="hidden min-[400px]:block"><ButtonLink href="/signup">สมัครสมาชิก <ArrowRight className="size-4" /></ButtonLink></span>
              </>
            )}
            <SiteMobileMenu links={NAV} signedIn={Boolean(viewer)} />
          </div>
        </div>
      </header>
      {children}
      <footer className="surface-dark bg-ink">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 text-sm sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="col-span-2 space-y-4 md:col-span-1">
            <Logo />
            <p className="max-w-xs text-xs leading-relaxed text-muted">
              สัญญาณ XAUUSD จากอินดิเคเตอร์ 1SHOT ส่งตรงจาก TradingView ถึงเว็บและ Telegram พร้อม Entry / SL / TP ที่ย้อนตรวจได้ทุกจุด
            </p>
          </div>
          <FooterCol title="เมนู" links={NAV.slice(0, 4)} />
          <FooterCol
            title="สมาชิก"
            links={[
              { href: "/login", label: "เข้าสู่ระบบ" },
              { href: "/signup", label: "สมัครสมาชิก" },
              { href: "/dashboard", label: "แดชบอร์ด" },
            ]}
          />
          <div>
            <p className="font-semibold text-fg">ช่องทางรับสัญญาณ</p>
            <ul className="mt-4 space-y-2.5 text-muted">
              <li>เว็บไซต์ (อัปเดตสด)</li>
              <li>ห้อง Telegram</li>
              <li>TradingView Alert</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-faint sm:px-6 md:flex-row md:items-start md:justify-between">
            <p className="shrink-0">© {new Date().getFullYear()} 1SHOT Signals</p>
            <p className="max-w-2xl leading-relaxed md:text-right">
              การเทรดทองคำและ CFD มีความเสี่ยงสูง อาจสูญเสียเงินทุนทั้งหมด สัญญาณเป็นข้อมูลจากอินดิเคเตอร์ ไม่ใช่คำแนะนำการลงทุนเฉพาะบุคคล
              และผลในอดีตไม่ได้รับประกันผลในอนาคต
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="font-semibold text-fg">{title}</p>
      <ul className="mt-4 space-y-2.5 text-muted">
        {links.map((l) => (
          <li key={l.href}>
            {l.href.includes("#") ? (
              <a href={l.href} className="transition-colors hover:text-fg">{l.label}</a>
            ) : (
              <Link href={l.href} className="transition-colors hover:text-fg">{l.label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
