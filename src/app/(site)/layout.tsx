import Link from "next/link";
import { ThemeToggle } from "@/components/theme";
import { isStaff } from "@/lib/types";
import { ArrowRight } from "lucide-react";
import { SiteMobileMenu } from "@/components/site/mobile-menu";
import { SiteNavLinks } from "@/components/site/nav-links";
import { Logo } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

const NAV = [
  { href: "/pricing", label: "แพ็กเกจและราคา" },
];

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const viewer = isSupabaseConfigured() ? await getViewer() : null;
  const staff = Boolean(viewer && isStaff(viewer.profile.role));
  return (
    <div className="relative">
      {/* WCAG 2.4.1 */}
      <a href="#main" className="sr-only z-[60] rounded-lg bg-brand px-4 py-3 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        ข้ามไปยังเนื้อหาหลัก
      </a>
      {/* Floating pill navbar — black in the dark theme, white in the light one; 72px tall so heroes can slide under it. */}
      <header className="pointer-events-none sticky top-0 z-40 h-18 px-2 pt-2 sm:px-3 sm:pt-3">
        <div className="pointer-events-auto relative mx-auto flex h-[3.75rem] max-w-6xl items-center justify-between gap-1.5 rounded-full border border-line bg-panel/90 pr-1.5 pl-3 text-fg shadow-[0_16px_40px_-18px_rgb(0_0_0/0.45)] backdrop-blur-xl sm:gap-3 sm:pr-2 sm:pl-5">
          <Link href="/" aria-label="หน้าแรก" className="min-w-0 shrink"><Logo tone="auto" className="h-7 w-auto max-w-[7.5rem] sm:h-8 sm:max-w-none" /></Link>
          <SiteNavLinks links={NAV} />
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {viewer ? (
              <Link href={staff ? "/admin" : "/dashboard"} className="hidden h-11 items-center gap-2 rounded-full bg-fg px-5 text-sm font-semibold text-ink transition-colors hover:bg-brand hover:text-white min-[400px]:inline-flex">
                {staff ? "ระบบหลังบ้าน" : "แดชบอร์ด"} <ArrowRight aria-hidden className="size-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden h-11 items-center rounded-full px-4 text-sm font-medium text-muted transition-colors hover:text-fg sm:inline-flex">เข้าสู่ระบบ</Link>
                <Link href="/signup" className="hidden h-11 items-center gap-2 rounded-full bg-fg px-5 text-sm font-semibold text-ink transition-colors hover:bg-brand hover:text-white min-[400px]:inline-flex">
                  สมัครสมาชิก <ArrowRight aria-hidden className="size-4" />
                </Link>
              </>
            )}
            <ThemeToggle className="size-11 rounded-full px-0" />
            <SiteMobileMenu links={NAV} signedIn={Boolean(viewer)} staff={staff} />
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-line bg-ink">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-6 gap-y-10 px-4 py-12 text-sm min-[440px]:grid-cols-2 sm:px-6 sm:py-14 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="space-y-4 min-[440px]:col-span-2 md:col-span-1">
            <Logo tone="auto" />
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
            <div className="flex shrink-0 flex-wrap items-center gap-4">
              <p>© {new Date().getFullYear()} 1SHOT Signals</p>
            </div>
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
