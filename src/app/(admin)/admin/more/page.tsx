import Link from "next/link";
import { BarChart3, FileText, Newspaper, LifeBuoy, Mail, Megaphone, ScrollText, SlidersHorizontal, UserCog, Webhook } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { requireStaff } from "@/lib/auth";

export const metadata = { title: "อื่นๆ" };

type Tile = { href: string; title: string; line: string; icon: LucideIcon };

/** Everything that isn't daily work, as big tiles. Keep in sync with the "อื่นๆ" entry in src/components/app/nav.tsx. */
const MORE: { title: string; tiles: Tile[] }[] = [
  {
    title: "ตั้งค่าที่ใช้บ่อย",
    tiles: [
      { href: "/admin/indicators", title: "อินดิเคเตอร์", line: "ชื่อ รูป คำอธิบาย และห้อง Telegram", icon: SlidersHorizontal },
      { href: "/admin/support", title: "คำขอจากลูกค้า", line: "เรื่องที่ลูกค้าส่งเข้ามา", icon: LifeBuoy },
      { href: "/admin/announcements", title: "ประกาศ", line: "แจ้งข่าวถึงสมาชิกทุกคน", icon: Megaphone },
      { href: "/admin/blog", title: "บล็อกข่าวสาร", line: "โพสต์ Facebook ที่เลื่อนบนหน้าแรก", icon: Newspaper },
      { href: "/admin/content", title: "ข่าวและสรุปเช้า", line: "เขียนสรุปตลาดประจำวัน", icon: FileText },
      { href: "/admin/lots", title: "Lot Exness", line: "ยอด Lot ที่ลูกค้าเทรด", icon: BarChart3 },
      { href: "/admin/team", title: "ทีมงาน", line: "เพิ่มหรือถอดแอดมิน", icon: UserCog },
    ],
  },
  {
    title: "ไว้ตรวจสอบย้อนหลัง",
    tiles: [
      { href: "/admin/access-history", title: "ประวัติการให้สิทธิ์", line: "ใครให้สิทธิ์อะไร เมื่อไร", icon: ScrollText },
      { href: "/admin/emails", title: "อีเมลที่ส่งออก", line: "ใบเสร็จและอีเมลแจ้งลูกค้า", icon: Mail },
      { href: "/admin/webhooks", title: "บันทึกระบบรับเงิน", line: "ข้อความจาก Stripe และ TradingView", icon: Webhook },
    ],
  },
];

export default async function MorePage() {
  await requireStaff();
  return (
    <>
      <PageHeader title="อื่นๆ" description="เครื่องมือที่ไม่ได้ใช้ทุกวัน" />
      <div className="space-y-10">
        {MORE.map((g) => (
          <section key={g.title} aria-labelledby={`more-${g.title}`}>
            <h2 id={`more-${g.title}`} className="mb-4 text-lg font-semibold">{g.title}</h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {g.tiles.map((t) => (
                <li key={t.href}>
                  <Link href={t.href} className="flex min-h-20 items-center gap-4 rounded-xl border border-line bg-panel p-4 transition-colors hover:border-brand/60">
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-panel-3 text-fg"><t.icon aria-hidden className="size-5" /></span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{t.title}</span>
                      <span className="block text-sm text-muted">{t.line}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
