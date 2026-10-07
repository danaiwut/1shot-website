import Link from "next/link";
import { AlertTriangle, ArrowRight, BadgeCheck, Clock, CreditCard, Newspaper, Package, Radio, Repeat, Users, Webhook } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Badge, ButtonLink, Empty } from "@/components/ui";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaff } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { fmtTHB, ORDER_STATUS, orderTerm } from "@/lib/store/pricing";
import type { Order, Profile } from "@/lib/types";
import { Panel, td, Th, theadRow } from "./_components/admin-ui";

export const metadata = { title: "ภาพรวมระบบ" };

type OrderRow = Order & { profiles: { email: string; display_name: string | null } | null };
type Receipt = { id: number; received_at: string; ok: boolean; error: string | null };

const DAY = 864e5;
const bkkDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" });
const shortDay = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short" });

/** Back-office home: money, members waiting on staff, and anything that went wrong. */
export default async function AdminHomePage() {
  const { supabase, profile } = await requireStaff();
  const now = Date.now();
  const d30 = new Date(now - 30 * DAY).toISOString();
  const d7 = new Date(now - 7 * DAY).toISOString();
  const d1 = new Date(now - DAY).toISOString();

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

  // Daily paid revenue for the last 30 days (Bangkok calendar days), for the bar chart.
  const byDay = new Map<string, number>();
  for (const o of paidRows) {
    const k = bkkDay.format(new Date(o.paid_at));
    byDay.set(k, (byDay.get(k) ?? 0) + o.amount_satang);
  }
  const days = Array.from({ length: 30 }, (_, i) => {
    const at = new Date(now - (29 - i) * DAY);
    return { key: bkkDay.format(at), label: shortDay.format(at), amount: byDay.get(bkkDay.format(at)) ?? 0 };
  });
  const peak = days.reduce((m, d) => (d.amount > m.amount ? d : m), days[0]);
  const salesDays = days.filter((d) => d.amount > 0).length;

  return (
    <>
      <PageHeader
        eyebrow="ระบบหลังบ้าน"
        title="ภาพรวมธุรกิจ"
        description={`สวัสดี ${name} · ติดตามยอดขาย ดูแลลูกค้า และจัดการ Indicator`}
        action={
          <>
            <ButtonLink href="/admin/work" variant="outline"><Clock aria-hidden className="size-4" /> ศูนย์งาน</ButtonLink>
            <ButtonLink href="/admin/members"><Users aria-hidden className="size-4" /> ตรวจสอบข้อมูลลูกค้า</ButtonLink>
          </>
        }
      />

      {errors.length > 0 && (
        <Link href="/admin/webhooks" className="mb-6 flex items-start gap-3 rounded-2xl border border-sell/40 bg-sell-dim px-4 py-3 text-sm text-sell transition-colors hover:border-sell/70">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0">
            <b>Webhook ถูกปฏิเสธ {errors.length} ครั้งใน 24 ชั่วโมง</b> · ล่าสุด: {errors[0].error ?? "ไม่ทราบสาเหตุ"} ({fmtDateTime(errors[0].received_at)})
          </span>
        </Link>
      )}

      <section aria-label="ตัวชี้วัดหลัก" className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiLink href="/admin/orders?status=paid">
          <StatCard icon={CreditCard} label="รายได้ 30 วัน" value={fmtTHB(revenue30)} foot={`7 วันล่าสุด ${fmtTHB(revenue7)}`} className="h-full" />
        </KpiLink>
        <KpiLink href="/admin/orders">
          <StatCard icon={Repeat} label="รายได้ประจำต่อเดือน" value={fmtTHB(mrr)} badge={<Badge tone="info">{activeSubs.length} ราย</Badge>} foot={`สมัครรายงวด ${activeSubs.length} ราย`} className="h-full" />
        </KpiLink>
        <KpiLink href="/admin/members">
          <StatCard icon={Users} label="สมาชิกทั้งหมด" value={String(members.count ?? 0)} badge={<Badge tone="buy">+{newMembers.count ?? 0}</Badge>} foot={`ใหม่ 7 วัน ${newMembers.count ?? 0} คน`} className="h-full" />
        </KpiLink>
        <KpiLink href="/admin/members?status=pending">
          <StatCard
            icon={BadgeCheck} label="รอตรวจ IB" value={`${queue.length}${queue.length === 6 ? "+" : ""}`} tone={queue.length ? "alert" : "default"}
            badge={<Badge tone={queue.length ? "brand" : "neutral"}>{queue.length ? "มีงานค้าง" : "เรียบร้อย"}</Badge>}
            foot={queue.length ? "มีงานรอผู้ดูแล" : "ไม่มีงานค้าง"} className="h-full"
          />
        </KpiLink>
      </section>

      <Panel
        className="mb-6"
        title="รายได้รายวัน"
        description={`30 วันล่าสุด · มียอดขาย ${salesDays} วัน${peak.amount ? ` · สูงสุด ${fmtTHB(peak.amount)} (${peak.label})` : ""}`}
        action={<ButtonLink href="/admin/orders?status=paid" variant="ghost">คำสั่งซื้อที่ชำระแล้ว <ArrowRight aria-hidden className="size-4" /></ButtonLink>}
      >
        <div className="px-4 pt-6 pb-4 sm:px-6">
          {salesDays ? (
            <figure>
              <div
                role="img"
                aria-label={`กราฟรายได้รายวัน 30 วันล่าสุด รวม ${fmtTHB(revenue30)} มียอดขาย ${salesDays} วัน วันที่สูงสุด ${peak.label} ${fmtTHB(peak.amount)}`}
                className="flex h-40 items-end gap-[3px] border-b border-line sm:gap-1.5"
              >
                {days.map((d) => (
                  <div key={d.key} title={`${d.label} · ${fmtTHB(d.amount)}`} className="flex h-full min-w-0 flex-1 items-end">
                    <div
                      className={d.amount ? "w-full rounded-t-[4px] bg-brand" : "w-full rounded-t-[2px] bg-panel-3"}
                      style={{ height: d.amount ? `${Math.max(4, (d.amount / peak.amount) * 100)}%` : "2px" }}
                    />
                  </div>
                ))}
              </div>
              <figcaption className="mt-2 flex justify-between text-xs text-muted">
                <span>{days[0].label}</span><span>{days[14].label}</span><span>วันนี้</span>
              </figcaption>
            </figure>
          ) : (
            <p className="py-10 text-center text-sm text-muted">ยังไม่มีรายได้ใน 30 วันล่าสุด</p>
          )}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title="คำสั่งซื้อล่าสุด"
          description="6 รายการล่าสุดทุกสถานะ"
          action={<ButtonLink href="/admin/orders" variant="ghost">ทั้งหมด <ArrowRight aria-hidden className="size-4" /></ButtonLink>}
        >
          {orders.length ? (
            <Table>
              <caption className="sr-only">คำสั่งซื้อล่าสุด</caption>
              <TableHeader>
                <TableRow className={theadRow}>
                  <Th>ลูกค้า</Th>
                  <Th>สินค้า</Th>
                  <Th className="text-right">ยอด</Th>
                  <Th>สถานะ</Th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id} className="border-line">
                    <TableCell className={td}>
                      <Link href={`/admin/members/${o.user_id}`} className="inline-flex min-h-11 flex-col justify-center font-medium hover:text-accent hover:underline">
                        {o.profiles?.display_name || o.profiles?.email || "—"}
                        <span className="text-xs font-normal text-muted">{fmtDateTime(o.created_at)}</span>
                      </Link>
                    </TableCell>
                    <TableCell className={td}>
                      {o.product_name}
                      <span className="block text-xs text-muted">{orderTerm(o)}</span>
                    </TableCell>
                    <TableCell className={`${td} num text-right font-semibold`}>{fmtTHB(o.amount_satang)}</TableCell>
                    <TableCell className={td}><Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty title="ยังไม่มีคำสั่งซื้อ" />
          )}
        </Panel>

        <div className="min-w-0 space-y-6">
          <Panel
            title="รอตรวจ Exness IB"
            description="กรอกเลขบัญชีแล้ว แต่ยังไม่ได้ยืนยัน"
            action={queue.length ? <ButtonLink href="/admin/members?status=pending" variant="ghost">ทั้งหมด <ArrowRight aria-hidden className="size-4" /></ButtonLink> : undefined}
          >
            {queue.length ? (
              <ul className="divide-y divide-line">
                {queue.map((m) => (
                  <li key={m.id}>
                    <Link href={`/admin/members/${m.id}`} className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-panel-2 sm:px-6">
                      <span className="flex min-w-0 items-center gap-3">
                        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-dim text-sm font-semibold text-accent uppercase">
                          {(m.display_name || m.email).slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{m.display_name || m.email}</span>
                          <span className="num block truncate text-xs text-muted">Exness {m.exness_account} · สมัคร {fmtDate(m.created_at)}</span>
                        </span>
                      </span>
                      <Badge tone="brand">ตรวจ</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="ไม่มีบัญชีรอตรวจ" />
            )}
          </Panel>

          <Panel title="ทางลัด">
            <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 sm:p-6">
              {[
                { href: "/admin/products/new", label: "เพิ่มสินค้า", icon: Package },
                { href: "/admin/content", label: "เขียนสรุปเช้า", icon: Newspaper },
                { href: "/admin/indicators", label: "ตั้งห้อง Telegram", icon: Radio },
                { href: "/admin/webhooks", label: "ดู Webhook", icon: Webhook },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="flex min-h-11 items-center gap-2.5 rounded-xl border border-line bg-panel-2 px-3 py-2.5 text-sm font-medium transition-colors hover:border-brand/40 hover:bg-brand-dim">
                  <l.icon aria-hidden className="size-4 text-accent" /> {l.label}
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function KpiLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group block rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>[data-slot=card]]:transition-colors hover:[&>[data-slot=card]]:border-brand/40">
      {children}
    </Link>
  );
}
