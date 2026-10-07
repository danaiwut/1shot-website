import Link from "next/link";
import { ThemeToggle } from "@/components/theme";
import { isStaff } from "@/lib/types";
import { ArrowRight } from "lucide-react";
import { SiteMobileMenu } from "@/components/site/mobile-menu";
import { SiteNavLinks } from "@/components/site/nav-links";
import { ButtonLink, Logo } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

const NAV = [
  { href: "/#indicators", label: "อินดิเคเตอร์" },
  { href: "/pricing", label: "แพ็กเกจและราคา" },
  { href: "/#how", label: "เริ่มใช้งาน" },
  { href: "/#about", label: "เกี่ยวกับเรา" },
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
      <header className="sticky top-0 z-40 border-b border-line bg-panel/95 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/" aria-label="หน้าแรก"><Logo tone="auto" /></Link>
          <SiteNavLinks links={NAV} />
          <div className="flex items-center gap-2">
            {viewer ? (
              <ButtonLink href={staff ? "/admin" : "/dashboard"}>{staff ? "ระบบหลังบ้าน" : "เข้าสู่แดชบอร์ด"} <ArrowRight className="size-4" /></ButtonLink>
            ) : (
              <>
                <span className="hidden sm:block"><ButtonLink href="/login" variant="ghost">เข้าสู่ระบบ</ButtonLink></span>
                <span className="hidden min-[400px]:block"><ButtonLink href="/signup">สมัครสมาชิก <ArrowRight className="size-4" /></ButtonLink></span>
              </>
            )}
            <ThemeToggle />
            <SiteMobileMenu links={NAV} signedIn={Boolean(viewer)} staff={staff} />
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-line bg-ink">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 text-sm sm:px-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="col-span-2 space-y-4 md:col-span-1">
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
