import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Clock, CreditCard, Repeat, Package, Users, Webhook } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, ButtonLink, Card, CardHeader, Empty } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { fmtTHB, ORDER_STATUS, orderTerm } from "@/lib/store/pricing";
import type { Order, Profile } from "@/lib/types";

export const metadata = { title: "ภาพรวมระบบ" };

type OrderRow = Order & { profiles: { email: string; display_name: string | null } | null };
type Receipt = { id: number; received_at: string; ok: boolean; error: string | null };

/** Back-office home: money, members waiting on staff, and anything that went wrong. */
export default async function AdminHomePage() {
  const { supabase, profile } = await requireStaff();
  const now = Date.now();
  const d30 = new Date(now - 30 * 864e5).toISOString();
  const d7 = new Date(now - 7 * 864e5).toISOString();
  const d1 = new Date(now - 864e5).toISOString();

  const [paid, recent, members, newMembers, ibQueue, subs, failures] = await Promise.all([
    supabase.from("orders").select("amount_satang, paid_at").eq("status", "paid").gte("paid_at", d30),
    supabase.from("orders").select("*, profiles(email, display_name)").order("created_at", { ascending: false }).limit(6),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d7),
    supabase.from("profiles").select("id, email, display_name, exness_account, created_at").not("exness_account", "is", null).eq("ib_verified", false)
      .order("created_at", { ascending: false }).limit(6),
    supabase.from("subscriptions").select("amount_satang, interval").in("status", ["active", "trialing"]),
    supabase.from("webhook_receipts").select("id, received_at, ok, error").eq("ok", false).gte("received_at", d1).order("received_at", { ascending: false }).limit(5),
  ]);

  const paidRows = (paid.data ?? []) as { amount_satang: number; paid_at: string }[];
  const revenue30 = paidRows.reduce((s, o) => s + o.amount_satang, 0);
  const revenue7 = paidRows.filter((o) => o.paid_at >= d7).reduce((s, o) => s + o.amount_satang, 0);
  const activeSubs = (subs.data ?? []) as { amount_satang: number; interval: string | null }[];
  const mrr = activeSubs.reduce((s, x) => s + (x.interval === "year" ? x.amount_satang / 12 : x.amount_satang), 0);
  const queue = (ibQueue.data ?? []) as Pick<Profile, "id" | "email" | "display_name" | "exness_account" | "created_at">[];
  const errors = (failures.data ?? []) as Receipt[];
  const orders = (recent.data ?? []) as OrderRow[];
  const name = profile.display_name || profile.email.split("@")[0];

  return (
    <>
      <PageHeader eyebrow="ระบบหลังบ้าน" title="ภาพรวมธุรกิจ" description={`สวัสดี ${name} · ติดตามยอดขาย ดูแลลูกค้า และจัดการ Indicator`} action={<ButtonLink href="/admin/members"><Users className="size-4" /> ตรวจสอบข้อมูลลูกค้า</ButtonLink>} />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <Kpi icon={CreditCard} label="รายได้ 30 วัน" value={fmtTHB(revenue30)} hint={`7 วันล่าสุด ${fmtTHB(revenue7)}`} href="/admin/orders?status=paid" />
        <Kpi icon={Repeat} label="รายได้ประจำต่อเดือน" value={fmtTHB(mrr)} hint={`สมัครรายงวด ${activeSubs.length} ราย`} href="/admin/orders" />
        <Kpi icon={Users} label="สมาชิกทั้งหมด" value={String(members.count ?? 0)} hint={`ใหม่ 7 วัน ${newMembers.count ?? 0} คน`} href="/admin/members" />
        <Kpi icon={Clock} label="รอตรวจ IB" value={`${queue.length}${queue.length === 6 ? "+" : ""}`} hint={queue.length ? "มีงานรอผู้ดูแล" : "ไม่มีงานค้าง"} href="/admin/members?status=pending" alert={queue.length > 0} />
      </div>

      {errors.length > 0 && (
        <Link href="/admin/webhooks" className="mt-6 flex items-start gap-3 rounded-2xl border border-sell/30 bg-sell-dim p-4 text-sm text-sell hover:border-sell/60">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            <b>Webhook ถูกปฏิเสธ {errors.length} ครั้งใน 24 ชั่วโมง</b> · ล่าสุด: {errors[0].error ?? "ไม่ทราบสาเหตุ"} ({fmtDateTime(errors[0].received_at)})
          </span>
        </Link>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader title="คำสั่งซื้อล่าสุด" action={<Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">ทั้งหมด <ArrowUpRight className="size-3.5" /></Link>} />
          {orders.length ? (
            <ul className="divide-y divide-line">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <Link href={`/admin/members/${o.user_id}`} className="block truncate text-sm font-medium hover:text-accent">
                      {o.profiles?.display_name || o.profiles?.email || "—"}
                    </Link>
                    <p className="truncate text-xs text-muted">{o.product_name} · {orderTerm(o)} · {fmtDateTime(o.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="num text-sm font-semibold">{fmtTHB(o.amount_satang)}</span>
                    <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="ยังไม่มีคำสั่งซื้อ" />
          )}
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader title="รอตรวจ Exness IB" hint="กรอกเลขบัญชีแล้ว แต่ยังไม่ได้ยืนยัน" />
            {queue.length ? (
              <ul className="divide-y divide-line">
                {queue.map((m) => (
                  <li key={m.id}>
                    <Link href={`/admin/members/${m.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-panel-2 sm:px-5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{m.display_name || m.email}</p>
                        <p className="num truncate text-xs text-muted">Exness {m.exness_account} · สมัคร {fmtDate(m.created_at)}</p>
                      </div>
                      <Badge tone="brand">ตรวจ</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-6 text-center text-sm text-muted">ไม่มีบัญชีรอตรวจ</p>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="text-sm font-semibold">ทางลัด</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {[
                { href: "/admin/products/new", label: "เพิ่มสินค้า", icon: Package },
                { href: "/admin/content", label: "เขียนสรุปเช้า", icon: ArrowUpRight },
                { href: "/admin/indicators", label: "ตั้งห้อง Telegram", icon: ArrowUpRight },
                { href: "/admin/webhooks", label: "ดู Webhook", icon: Webhook },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 hover:border-brand/40 hover:bg-brand-dim">
                  <l.icon className="size-4 text-accent" /> {l.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Kpi({ icon: Icon, label, value, hint, href, alert }: { icon: typeof Users; label: string; value: string; hint: string; href: string; alert?: boolean }) {
  return (
    <Link href={href} className="group block">
      <Card className={`h-full p-3.5 transition-colors group-hover:border-brand/40 sm:p-5 ${alert ? "border-brand/40" : ""}`}>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted sm:text-xs">{label}</p>
          <Icon className={`size-4 ${alert ? "text-accent" : "text-faint"}`} />
        </div>
        <p className="num mt-1.5 text-xl font-semibold sm:text-2xl">{value}</p>
        <p className={`mt-1 text-xs sm:text-xs ${alert ? "text-accent" : "text-faint"}`}>{hint}</p>
      </Card>
    </Link>
  );
}
