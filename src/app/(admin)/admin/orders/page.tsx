import Link from "next/link";
import { CreditCard, ExternalLink, Repeat, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Badge, Empty, FilterLink } from "@/components/ui";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaff } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { fmtTHB, ORDER_STATUS, orderTerm, SUB_STATUS } from "@/lib/store/pricing";
import type { Order, OrderStatus, Subscription } from "@/lib/types";
import { Panel, Segmented, td, Th, theadRow, Toolbar } from "../_components/admin-ui";
import { RefundButton } from "./refund-button";

export const metadata = { title: "คำสั่งซื้อ" };

type WithUser<T> = T & { profiles: { email: string; display_name: string | null } | null };
const FILTERS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "ทั้งหมด" }, { id: "paid", label: "ชำระแล้ว" }, { id: "pending", label: "รอชำระ" },
  { id: "failed", label: "ไม่สำเร็จ" }, { id: "refunded", label: "คืนเงิน" }, { id: "canceled", label: "ยกเลิก" },
];

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = FILTERS.find((f) => f.id === sp.status)?.id ?? "all";
  const { supabase } = await requireStaff();

  let list = supabase.from("orders").select("*, profiles(email, display_name)").order("created_at", { ascending: false }).limit(200);
  if (status !== "all") list = list.eq("status", status);
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const [{ data: orders }, { data: paid }, { data: subs }] = await Promise.all([
    list,
    supabase.from("orders").select("amount_satang, paid_at").eq("status", "paid"),
    supabase.from("subscriptions").select("*, profiles(email, display_name)").order("created_at", { ascending: false }).limit(100),
  ]);
  const paidRows = (paid ?? []) as { amount_satang: number; paid_at: string | null }[];
  const subscriptions = (subs ?? []) as WithUser<Subscription>[];
  const activeSubs = subscriptions.filter((s) => s.status === "active" || s.status === "trialing");
  const mrr = activeSubs.reduce((sum, s) => sum + (s.interval === "year" ? s.amount_satang / 12 : s.amount_satang), 0);
  const sum = (rows: { amount_satang: number }[]) => rows.reduce((s, o) => s + o.amount_satang, 0);
  const stripeBase = `https://dashboard.stripe.com${/^(sk|rk)_test_/.test(serverEnv.stripeSecretKey()) ? "/test" : ""}`;

  const list30 = paidRows.filter((o) => (o.paid_at ?? "") >= since30);
  const rows = (orders ?? []) as WithUser<Order>[];
  const stripeLink = "inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-panel-3 hover:text-fg";

  return (
    <>
      <PageHeader eyebrow="ผู้ดูแลระบบ" title="คำสั่งซื้อ" description="คืนเงินจากที่นี่หรือจากหน้า Stripe ก็ได้ ระบบจะถอนสิทธิ์ที่ได้จากคำสั่งซื้อนั้นให้อัตโนมัติ" />

      <section aria-label="สรุปยอดขาย" className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard icon={CreditCard} label="รายได้ 30 วัน" value={fmtTHB(sum(list30))} foot={`${list30.length} คำสั่งซื้อที่ชำระแล้ว`} />
        <StatCard icon={Wallet} label="รายได้ทั้งหมด" value={fmtTHB(sum(paidRows))} foot={`${paidRows.length} คำสั่งซื้อที่ชำระแล้ว`} />
        <StatCard icon={Users} label="สมัครรายงวดที่ใช้งาน" value={String(activeSubs.length)} foot={`จาก ${subscriptions.length} การสมัครล่าสุด`} />
        <StatCard icon={Repeat} label="รายได้ประจำต่อเดือน" value={fmtTHB(mrr)} foot="รายปีคิดเฉลี่ยต่อเดือน" />
      </section>

      <Panel className="mb-6" title="รายการคำสั่งซื้อ" description={`${rows.length} รายการ${rows.length === 200 ? " (แสดงสูงสุด 200)" : ""}`}>
        <Toolbar>
          <Segmented label="กรองคำสั่งซื้อตามสถานะ">
            {FILTERS.map((f) => (
              <FilterLink key={f.id} href={f.id === "all" ? "/admin/orders" : `/admin/orders?status=${f.id}`} on={status === f.id}>{f.label}</FilterLink>
            ))}
          </Segmented>
        </Toolbar>
        {rows.length ? (
          <Table className="min-w-[860px]">
            <caption className="sr-only">คำสั่งซื้อ {rows.length} รายการ</caption>
            <TableHeader>
              <TableRow className={theadRow}>
                <Th>ลูกค้า</Th>
                <Th>สินค้า</Th>
                <Th>วันที่</Th>
                <Th className="text-right">ยอด</Th>
                <Th>สถานะ</Th>
                <Th className="text-right"><span className="sr-only">การจัดการ</span></Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => {
                const st = ORDER_STATUS[o.status];
                return (
                  <TableRow key={o.id} className="border-line">
                    <TableCell className={td}>
                      <Link href={`/admin/members/${o.user_id}`} className="inline-flex min-h-11 flex-col justify-center font-medium hover:text-accent hover:underline">
                        {o.profiles?.display_name || o.profiles?.email || "—"}
                        <span className="text-xs font-normal text-muted">{o.profiles?.email}</span>
                      </Link>
                    </TableCell>
                    <TableCell className={td}>
                      {o.product_name}
                      <span className="block text-xs text-muted">{orderTerm(o)}{o.kind === "renewal" && " · ต่ออายุ"}</span>
                    </TableCell>
                    <TableCell className={`${td} text-muted`}>{fmtDateTime(o.created_at)}</TableCell>
                    <TableCell className={`${td} num text-right font-semibold`}>{fmtTHB(o.amount_satang)}</TableCell>
                    <TableCell className={td}><Badge tone={st.tone}>{st.label}</Badge></TableCell>
                    <TableCell className={td}>
                      <div className="flex items-center justify-end gap-1">
                        {o.status === "paid" && <RefundButton orderId={o.id} label={`${fmtTHB(o.amount_satang)} · ${o.product_name}`} />}
                        {o.stripe_payment_intent_id && (
                          <a href={`${stripeBase}/payments/${o.stripe_payment_intent_id}`} target="_blank" rel="noopener noreferrer" className={stripeLink} aria-label={`เปิดคำสั่งซื้อ ${o.product_name} ใน Stripe (เปิดแท็บใหม่)`}>
                            <ExternalLink aria-hidden className="size-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Empty title="ไม่มีคำสั่งซื้อ" />
        )}
      </Panel>

      <Panel title="การสมัครแบบรายงวด" description={`${activeSubs.length} รายการที่ใช้งานอยู่`}>
        {subscriptions.length ? (
          <Table className="min-w-[760px]">
            <caption className="sr-only">การสมัครแบบรายงวด</caption>
            <TableHeader>
              <TableRow className={theadRow}>
                <Th>ลูกค้า</Th>
                <Th>แพ็กเกจ</Th>
                <Th>รอบถัดไป</Th>
                <Th>สถานะ</Th>
                <Th className="text-right"><span className="sr-only">Stripe</span></Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((s) => {
                const st = SUB_STATUS[s.status] ?? { label: s.status, tone: "neutral" as const };
                return (
                  <TableRow key={s.id} className="border-line">
                    <TableCell className={td}>
                      <Link href={`/admin/members/${s.user_id}`} className="inline-flex min-h-11 items-center font-medium hover:text-accent hover:underline">{s.profiles?.display_name || s.profiles?.email || "—"}</Link>
                    </TableCell>
                    <TableCell className={td}>
                      {s.product_name}
                      <span className="num block text-xs text-muted">{fmtTHB(s.amount_satang)}/{s.interval === "year" ? "ปี" : "เดือน"}</span>
                    </TableCell>
                    <TableCell className={`${td} text-muted`}>
                      {s.current_period_end && s.status !== "canceled" ? `${s.cancel_at_period_end ? "สิ้นสุด" : "ต่ออายุ"} ${fmtDate(s.current_period_end)}` : <span className="text-faint">—</span>}
                    </TableCell>
                    <TableCell className={td}>
                      <span className="flex flex-wrap gap-1.5">
                        <Badge tone={st.tone}>{st.label}</Badge>
                        {s.cancel_at_period_end && <Badge>ไม่ต่ออายุ</Badge>}
                      </span>
                    </TableCell>
                    <TableCell className={`${td} text-right`}>
                      <a href={`${stripeBase}/subscriptions/${s.id}`} target="_blank" rel="noopener noreferrer" className={stripeLink} aria-label={`เปิดการสมัคร ${s.product_name} ใน Stripe (เปิดแท็บใหม่)`}><ExternalLink aria-hidden className="size-4" /></a>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Empty title="ยังไม่มีการสมัครแบบรายงวด" />
        )}
      </Panel>
    </>
  );
}
