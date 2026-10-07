import Link from "next/link";
import { EmptyLine, Section, Segmented, StatRow, TableBox, Td, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { Badge, FilterLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { fmtTHB, ORDER_STATUS, orderTerm, SUB_STATUS } from "@/lib/store/pricing";
import type { Order, OrderStatus, Subscription } from "@/lib/types";
import { ToneStatus } from "../_components/tone-status";
import { RefundButton } from "./refund-button";

export const metadata = { title: "ยอดขาย" };

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
  const stripeLink = "inline-flex min-h-11 shrink-0 items-center rounded-md px-2 text-sm font-medium text-accent underline-offset-4 hover:underline";

  return (
    <>
      <PageHeader title="ยอดขาย" description="ใครซื้ออะไร เท่าไร ถ้ากดคืนเงิน ระบบจะถอนสิทธิ์ของคำสั่งซื้อนั้นให้เอง" />

      <div className="space-y-10">
        <StatRow
          items={[
            { label: "รายได้ 30 วัน", value: fmtTHB(sum(list30)), hint: `${list30.length} คำสั่งซื้อที่ชำระแล้ว` },
            { label: "รายได้ทั้งหมด", value: fmtTHB(sum(paidRows)), hint: `${paidRows.length} คำสั่งซื้อที่ชำระแล้ว` },
            { label: "สมัครรายงวดที่ใช้งาน", value: activeSubs.length, hint: `จาก ${subscriptions.length} การสมัครล่าสุด` },
            { label: "รายได้ประจำต่อเดือน", value: fmtTHB(mrr), hint: "รายปีคิดเฉลี่ยต่อเดือน" },
          ]}
        />

        <Section
          title="รายการคำสั่งซื้อ"
          description={`${rows.length} รายการ${rows.length === 200 ? " (แสดงสูงสุด 200)" : ""}`}
          action={
            <Segmented label="กรองคำสั่งซื้อตามสถานะ">
              {FILTERS.map((f) => (
                <FilterLink key={f.id} href={f.id === "all" ? "/admin/orders" : `/admin/orders?status=${f.id}`} on={status === f.id}>{f.label}</FilterLink>
              ))}
            </Segmented>
          }
        >
          {rows.length ? (
            <TableBox caption={`คำสั่งซื้อ ${rows.length} รายการ`} minWidth={860}>
              <thead className="bg-panel-2">
                <tr>
                  <Th>ลูกค้า</Th>
                  <Th>สินค้า</Th>
                  <Th>วันที่</Th>
                  <Th className="text-right">ยอด</Th>
                  <Th>สถานะ</Th>
                  <Th className="text-right"><span className="sr-only">การจัดการ</span></Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const st = ORDER_STATUS[o.status];
                  return (
                    <tr key={o.id} className="border-t border-line">
                      <Td>
                        <Link href={`/admin/members/${o.user_id}`} className="inline-flex min-h-11 flex-col justify-center font-medium hover:text-accent hover:underline">
                          {o.profiles?.display_name || o.profiles?.email || "—"}
                          <span className="text-xs font-normal text-muted">{o.profiles?.email}</span>
                        </Link>
                      </Td>
                      <Td>
                        {o.product_name}
                        <span className="block text-xs text-muted">{orderTerm(o)}{o.kind === "renewal" && " · ต่ออายุ"}</span>
                      </Td>
                      <Td className="num text-muted tabular-nums">{fmtDateTime(o.created_at)}</Td>
                      <Td className="num text-right font-medium tabular-nums">{fmtTHB(o.amount_satang)}</Td>
                      <Td><ToneStatus tone={st.tone}>{st.label}</ToneStatus></Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1">
                          {o.status === "paid" && <RefundButton orderId={o.id} label={`${fmtTHB(o.amount_satang)} · ${o.product_name}`} />}
                          {o.stripe_payment_intent_id && (
                            <a href={`${stripeBase}/payments/${o.stripe_payment_intent_id}`} target="_blank" rel="noopener noreferrer" className={stripeLink} aria-label={`เปิดคำสั่งซื้อ ${o.product_name} ใน Stripe (เปิดแท็บใหม่)`}>
                              Stripe
                            </a>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableBox>
          ) : (
            <EmptyLine>ไม่มีคำสั่งซื้อ</EmptyLine>
          )}
        </Section>

        <Section title="การสมัครแบบรายงวด" description={`${activeSubs.length} รายการที่ใช้งานอยู่`}>
          {subscriptions.length ? (
            <TableBox caption="การสมัครแบบรายงวด" minWidth={760}>
              <thead className="bg-panel-2">
                <tr>
                  <Th>ลูกค้า</Th>
                  <Th>แพ็กเกจ</Th>
                  <Th>รอบถัดไป</Th>
                  <Th>สถานะ</Th>
                  <Th className="text-right"><span className="sr-only">Stripe</span></Th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => {
                  const st = SUB_STATUS[s.status] ?? { label: s.status, tone: "neutral" as const };
                  return (
                    <tr key={s.id} className="border-t border-line">
                      <Td>
                        <Link href={`/admin/members/${s.user_id}`} className="inline-flex min-h-11 items-center font-medium hover:text-accent hover:underline">{s.profiles?.display_name || s.profiles?.email || "—"}</Link>
                      </Td>
                      <Td>
                        {s.product_name}
                        <span className="num block text-xs text-muted tabular-nums">{fmtTHB(s.amount_satang)}/{s.interval === "year" ? "ปี" : "เดือน"}</span>
                      </Td>
                      <Td className="text-muted">
                        {s.current_period_end && s.status !== "canceled" ? `${s.cancel_at_period_end ? "สิ้นสุด" : "ต่ออายุ"} ${fmtDate(s.current_period_end)}` : <span className="text-faint">—</span>}
                      </Td>
                      <Td>
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <ToneStatus tone={st.tone}>{st.label}</ToneStatus>
                          {s.cancel_at_period_end && <Badge>ไม่ต่ออายุ</Badge>}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <a href={`${stripeBase}/subscriptions/${s.id}`} target="_blank" rel="noopener noreferrer" className={stripeLink} aria-label={`เปิดการสมัคร ${s.product_name} ใน Stripe (เปิดแท็บใหม่)`}>Stripe</a>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableBox>
          ) : (
            <EmptyLine>ยังไม่มีการสมัครแบบรายงวด</EmptyLine>
          )}
        </Section>
      </div>
    </>
  );
}
