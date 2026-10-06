import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarClock, CreditCard, LifeBuoy, Webhook } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, Empty } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { fmtTHB } from "@/lib/store/pricing";
import { requestSubject } from "@/lib/support";
import type { SupportKind } from "@/lib/types";

export const metadata = { title: "ศูนย์งาน" };

type Who = { email: string; display_name: string | null } | null;
type Item = { key: string; href: string; title: string; meta: string };

export default async function WorkCenterPage() {
  const { supabase } = await requireStaff();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const in7 = new Date(now + 7 * 864e5).toISOString();
  const d1 = new Date(now - 864e5).toISOString();
  const hour = new Date(now - 36e5).toISOString();

  const [support, ib, orders, hooks, expiring] = await Promise.all([
    supabase.from("support_requests").select("id, kind, indicator_code, updated_at, profiles!support_requests_user_id_fkey(email, display_name)").eq("status", "open").order("updated_at").limit(20),
    supabase.from("profiles").select("id, email, display_name, exness_account, created_at").not("exness_account", "is", null).eq("ib_verified", false).order("created_at").limit(20),
    supabase.from("orders").select("id, amount_satang, created_at, profiles(email, display_name)").eq("status", "pending").lt("created_at", hour).order("created_at", { ascending: false }).limit(20),
    supabase.from("webhook_receipts").select("id, received_at, error").eq("ok", false).gte("received_at", d1).order("received_at", { ascending: false }).limit(20),
    supabase.from("indicator_rights").select("user_id, code, expires_at, profiles!indicator_rights_user_id_fkey(email, display_name)").gte("expires_at", nowIso).lte("expires_at", in7).order("expires_at").limit(30),
  ]);
  const name = (p: Who) => p?.display_name || p?.email || "—";
  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

  const sections: { id: string; icon: LucideIcon; title: string; hint: string; href: string; items: Item[] }[] = [
    {
      id: "support", icon: LifeBuoy, title: "คำขอที่รอตอบ", hint: "สมาชิกส่งเรื่องเข้ามาและยังไม่ได้รับคำตอบ", href: "/admin/support?status=open",
      items: (support.data ?? []).map((r) => ({ key: r.id, href: `/admin/support/${r.id}`, title: `${requestSubject(r.kind as SupportKind, r.indicator_code)} · ${name(one(r.profiles as Who | Who[]))}`, meta: `อัปเดต ${fmtDateTime(r.updated_at)}` })),
    },
    {
      id: "ib", icon: BadgeCheck, title: "รอตรวจ Exness IB", hint: "ตรวจเลขบัญชีในพอร์ทัล Partner แล้วกดยืนยันในหน้าสมาชิก", href: "/admin/members?status=pending",
      items: (ib.data ?? []).map((p) => ({ key: p.id, href: `/admin/members/${p.id}`, title: `${name(p)} · บัญชี ${p.exness_account}`, meta: `ส่งเมื่อ ${fmtDate(p.created_at)}` })),
    },
    {
      id: "expiring", icon: CalendarClock, title: "สิทธิ์หมดอายุใน 7 วัน", hint: "ทักสมาชิกเพื่อเตือนต่ออายุ หรือขยายสิทธิ์ให้ในหน้าสมาชิก", href: "/admin/members",
      items: (expiring.data ?? []).map((r) => ({ key: `${r.user_id}-${r.code}`, href: `/admin/members/${r.user_id}`, title: `${r.code} · ${name(one(r.profiles as Who | Who[]))}`, meta: `หมด ${fmtDateTime(r.expires_at)}` })),
    },
    {
      id: "orders", icon: CreditCard, title: "คำสั่งซื้อค้างชำระเกิน 1 ชั่วโมง", hint: "ลูกค้าอาจติดปัญหาการชำระเงิน", href: "/admin/orders?status=pending",
      items: (orders.data ?? []).map((o) => ({ key: o.id, href: "/admin/orders?status=pending", title: `${fmtTHB(o.amount_satang)} · ${name(one(o.profiles as Who | Who[]))}`, meta: `สร้าง ${fmtDateTime(o.created_at)}` })),
    },
    {
      id: "hooks", icon: Webhook, title: "Webhook ล้มเหลวใน 24 ชั่วโมง", hint: "ตรวจสอบใน Stripe Dashboard แล้วส่งซ้ำ", href: "/admin/webhooks",
      items: (hooks.data ?? []).map((h) => ({ key: h.id, href: "/admin/webhooks", title: h.error || "ไม่ทราบสาเหตุ", meta: fmtDateTime(h.received_at) })),
    },
  ];
  const total = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <>
      <PageHeader eyebrow="ระบบหลังบ้าน" title="ศูนย์งาน" description={total ? `มีงานรอดำเนินการ ${total} รายการ เรียงตามความเร่งด่วน` : "ไม่มีงานค้าง ทุกอย่างเรียบร้อย"} />
      <nav aria-label="สรุปงาน" className="mb-6 flex flex-wrap gap-2">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong px-3 text-sm hover:border-fg">
            {s.title} <Badge tone={s.items.length ? "brand" : "neutral"}><span className="num">{s.items.length}</span></Badge>
          </a>
        ))}
      </nav>
      <div className="space-y-6">
        {sections.map(({ id, icon: Icon, title, hint, href, items }) => (
          <Card key={id} id={id} className="scroll-mt-24 overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="flex gap-3">
                <Icon aria-hidden className="mt-1 size-5 shrink-0 text-accent" />
                <div><h2 className="font-bold">{title} <span className="num text-muted">({items.length})</span></h2><p className="text-sm text-muted">{hint}</p></div>
              </div>
              <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium underline underline-offset-4 hover:text-accent">ดูทั้งหมด <ArrowRight aria-hidden className="size-4" /></Link>
            </div>
            {items.length ? (
              <ul className="divide-y divide-line">
                {items.map((i) => (
                  <li key={i.key}>
                    <Link href={i.href} className="flex min-h-11 flex-col gap-0.5 px-5 py-3 hover:bg-panel-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-medium">{i.title}</span><span className="text-sm text-muted">{i.meta}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <Empty title="ไม่มีงานค้างในหมวดนี้" />}
          </Card>
        ))}
      </div>
    </>
  );
}
