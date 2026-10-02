import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, CardHeader, cx, Empty } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { fmtTHB, ORDER_STATUS, orderTerm, SUB_STATUS } from "@/lib/store/pricing";
import type { Order, OrderStatus, Subscription } from "@/lib/types";

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

  return (
    <>
      <PageHeader eyebrow="Admin" title="คำสั่งซื้อ" description="คำสั่งซื้อจาก Stripe และการสมัครแบบรายงวด คืนเงินได้จากหน้า Stripe แล้วสถานะจะอัปเดตเอง" />

      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <Stat label="รายได้ 30 วัน" value={fmtTHB(sum(paidRows.filter((o) => (o.paid_at ?? "") >= since30)))} />
        <Stat label="รายได้ทั้งหมด" value={fmtTHB(sum(paidRows))} />
        <Stat label="สมัครรายงวดที่ใช้งาน" value={String(activeSubs.length)} />
        <Stat label="รายได้ประจำต่อเดือน" value={fmtTHB(mrr)} />
      </div>

      <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => (
          <Link key={f.id} href={f.id === "all" ? "/admin/orders" : `/admin/orders?status=${f.id}`}
            className={cx("shrink-0 rounded-full border px-3 py-1 text-xs font-medium", status === f.id ? "border-fg bg-fg text-ink" : "border-line bg-panel text-muted hover:text-fg")}>
            {f.label}
          </Link>
        ))}
      </div>

      <Card className="mb-6 overflow-hidden">
        {orders?.length ? (
          <ul className="divide-y divide-line">
            {(orders as WithUser<Order>[]).map((o) => {
              const st = ORDER_STATUS[o.status];
              return (
                <li key={o.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-4 py-3.5 md:grid-cols-[1.3fr_1.2fr_auto_auto] sm:px-5">
                  <div className="min-w-0">
                    <Link href={`/admin/members/${o.user_id}`} className="block truncate text-sm font-medium hover:text-accent">
                      {o.profiles?.display_name || o.profiles?.email || "—"}
                    </Link>
                    <p className="truncate text-[11px] text-muted">{o.profiles?.email}</p>
                  </div>
                  <p className="num text-right text-sm font-semibold md:order-3">{fmtTHB(o.amount_satang)}</p>
                  <div className="min-w-0 md:order-2">
                    <p className="truncate text-sm">{o.product_name} <span className="text-muted">· {orderTerm(o)}</span></p>
                    <p className="text-[11px] text-faint">{fmtDateTime(o.created_at)}{o.kind === "renewal" && " · ต่ออายุ"}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2 md:order-4">
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {o.stripe_payment_intent_id && !o.stripe_payment_intent_id.startsWith("pi_mock") && (
                      <a href={`${stripeBase}/payments/${o.stripe_payment_intent_id}`} target="_blank" rel="noopener noreferrer" className="text-faint hover:text-fg" aria-label="เปิดใน Stripe">
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty title="ไม่มีคำสั่งซื้อ" />
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="การสมัครแบบรายงวด" hint={`${activeSubs.length} รายการที่ใช้งานอยู่`} />
        {subscriptions.length ? (
          <ul className="divide-y divide-line">
            {subscriptions.map((s) => {
              const st = SUB_STATUS[s.status] ?? { label: s.status, tone: "neutral" as const };
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                  <div className="min-w-0">
                    <Link href={`/admin/members/${s.user_id}`} className="text-sm font-medium hover:text-accent">{s.profiles?.display_name || s.profiles?.email || "—"}</Link>
                    <p className="text-xs text-muted">{s.product_name} · <span className="num">{fmtTHB(s.amount_satang)}/{s.interval === "year" ? "ปี" : "เดือน"}</span></p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {s.current_period_end && <span>{s.cancel_at_period_end ? "สิ้นสุด" : "ต่ออายุ"} {fmtDate(s.current_period_end)}</span>}
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {s.cancel_at_period_end && <Badge>ไม่ต่ออายุ</Badge>}
                    {!s.id.startsWith("sub_mock") && (
                      <a href={`${stripeBase}/subscriptions/${s.id}`} target="_blank" rel="noopener noreferrer" className="text-faint hover:text-fg" aria-label="เปิดใน Stripe"><ExternalLink className="size-3.5" /></a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty title="ยังไม่มีการสมัครแบบรายงวด" />
        )}
      </Card>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3.5 sm:p-5">
      <p className="text-[11px] text-muted sm:text-xs">{label}</p>
      <p className="num mt-1.5 text-xl font-semibold sm:text-2xl">{value}</p>
    </Card>
  );
}
