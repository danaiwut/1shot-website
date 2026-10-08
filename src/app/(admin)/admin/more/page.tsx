import Link from "next/link";
import { ArrowRight, BarChart3, FileText, LifeBuoy, ScrollText, SlidersHorizontal, UserCog } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { requireStaff } from "@/lib/auth";

export const metadata = { title: "อื่นๆ" };

type Tile = { href: string; title: string; line: string; icon: LucideIcon };

/** Everything that isn't daily work, as big tiles. Keep in sync with the "อื่นๆ" entry in src/components/app/nav.tsx. */
const MORE: { title: string; line: string; tiles: Tile[] }[] = [
  {
    title: "ตั้งค่าที่ใช้บ่อย",
    line: "ร้านค้า ลูกค้า และทีมงาน",
    tiles: [
      { href: "/admin/indicators", title: "อินดิเคเตอร์", line: "ชื่อ รูป คำอธิบาย และห้อง Telegram", icon: SlidersHorizontal },
      { href: "/admin/support", title: "คำขอจากลูกค้า", line: "เรื่องที่ลูกค้าส่งเข้ามา", icon: LifeBuoy },
      { href: "/admin/content", title: "เนื้อหา", line: "สรุปเช้า ข่าวโลก ประกาศ และบล็อก Facebook", icon: FileText },
      { href: "/admin/lots", title: "Lot Exness", line: "ยอด Lot ที่ลูกค้าเทรด", icon: BarChart3 },
      { href: "/admin/team", title: "ทีมงาน", line: "เพิ่มหรือถอดแอดมิน", icon: UserCog },
    ],
  },
  {
    title: "ไว้ตรวจสอบย้อนหลัง",
    line: "ดูว่าระบบทำอะไรไปแล้วบ้าง",
    tiles: [
      { href: "/admin/logs", title: "บันทึกระบบ", line: "อีเมลที่ส่ง, Webhook TradingView และประวัติการให้สิทธิ์", icon: ScrollText },
    ],
  },
];

export default async function MorePage() {
  const { supabase } = await requireStaff();
  const { count: openRequests } = await supabase.from("support_requests").select("id", { count: "exact", head: true }).eq("status", "open");
  const badge: Record<string, string | undefined> = { "/admin/support": openRequests ? `รอตอบ ${openRequests}` : undefined };

  return (
    <>
      <PageHeader title="อื่นๆ" description="เครื่องมือที่ไม่ได้ใช้ทุกวัน" />
      <div className="space-y-12">
        {MORE.map((g, i) => (
          <section key={g.title} aria-labelledby={`more-${i}`}>
            <div className="mb-4">
              <h2 id={`more-${i}`} className="text-lg font-bold tracking-tight">{g.title}</h2>
              <p className="text-sm text-muted">{g.line}</p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {g.tiles.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    className="group flex h-full min-h-36 flex-col justify-between gap-5 rounded-2xl border border-line bg-panel p-5 shadow-[0_20px_60px_-40px_rgb(0_0_0/0.35)] transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-brand/50 focus-visible:border-brand"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-[0_10px_30px_-10px_rgb(178_0_22/0.7)]"><t.icon aria-hidden className="size-6" /></span>
                      {badge[t.href]
                        ? <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white tabular-nums">{badge[t.href]}</span>
                        : <ArrowRight aria-hidden className="size-5 text-faint transition-transform group-hover:translate-x-1 group-hover:text-accent" />}
                    </span>
                    <span>
                      <span className="block text-lg font-bold">{t.title}</span>
                      <span className="mt-0.5 block text-sm text-muted">{t.line}</span>
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
