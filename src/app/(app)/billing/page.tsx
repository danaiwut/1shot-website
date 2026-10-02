import Link from "next/link";
import { ExternalLink, Repeat, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, ButtonLink, Card, CardHeader, Empty } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { fmtTHB, ORDER_STATUS, orderTerm, SUB_STATUS } from "@/lib/store/pricing";
import type { Order, Subscription } from "@/lib/types";
import { PortalButton, SubscriptionToggle } from "./subscription-actions";

export const metadata = { title: "การชำระเงิน" };

export default async function BillingPage() {
  const { supabase, userId } = await requireViewer();
  const [{ data: subs }, { data: orders }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("orders").select("*").eq("user_id", userId).neq("status", "pending").order("created_at", { ascending: false }).limit(100),
  ]);
  const subscriptions = (subs ?? []) as Subscription[];
  const history = (orders ?? []) as Order[];
  const live = subscriptions.filter((s) => ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(s.status));
  const ended = subscriptions.filter((s) => !live.includes(s));

  return (
    <>
      <PageHeader
        eyebrow="Billing"
        title="การชำระเงิน"
        description="การสมัครแบบรายงวด ประวัติการซื้อ และใบเสร็จ"
        action={<div className="flex flex-wrap items-start gap-2">{subscriptions.length > 0 && <PortalButton />}<ButtonLink href="/store"><ShoppingBag className="size-4" /> ซื้อเพิ่ม</ButtonLink></div>}
      />

      <Card className="mb-6">
        <CardHeader title="การสมัครแบบรายงวด" hint="ยกเลิกแล้วยังใช้งานได้จนจบงวดที่จ่ายไว้" />
        {live.length ? (
          <ul className="divide-y divide-line">
            {live.map((s) => {
              const st = SUB_STATUS[s.status] ?? { label: s.status, tone: "neutral" as const };
              const end = s.current_period_end ? fmtDate(s.current_period_end) : "—";
              return (
                <li key={s.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-dim text-accent"><Repeat className="size-4" /></span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        {s.product_name}
                        <Badge tone={st.tone}>{st.label}</Badge>
                        {s.cancel_at_period_end && <Badge>ไม่ต่ออายุ</Badge>}
                      </p>
                      <p className="num mt-0.5 text-xs text-muted">
                        {fmtTHB(s.amount_satang)}/{s.interval === "year" ? "ปี" : "เดือน"} · {s.codes.join(" · ")}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {s.cancel_at_period_end ? `สิ้นสุด ${end}` : `ต่ออายุครั้งถัดไป ${end}`}
                        {s.status === "past_due" && <span className="text-sell"> · ตัดบัตรไม่สำเร็จ กรุณาอัปเดตบัตรใน Stripe</span>}
                      </p>
                    </div>
                  </div>
                  <SubscriptionToggle id={s.id} cancelAtPeriodEnd={s.cancel_at_period_end} endsOn={end} />
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty title="ไม่มีการสมัครแบบรายงวด"><Link href="/store" className="text-accent hover:underline">ดูแพ็กเกจรายเดือน</Link></Empty>
        )}
        {ended.length > 0 && (
          <p className="border-t border-line px-5 py-3 text-xs text-faint">สิ้นสุดแล้ว: {ended.map((s) => s.product_name).join(", ")}</p>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="ประวัติการซื้อ" />
        {history.length ? (
          <ul className="divide-y divide-line">
            {history.map((o) => {
              const st = ORDER_STATUS[o.status];
              return (
                <li key={o.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 sm:grid-cols-[1.4fr_1fr_auto_auto] sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{o.product_name} <span className="text-muted">· {orderTerm(o)}</span></p>
                    <p className="text-[11px] text-faint">{fmtDateTime(o.paid_at ?? o.created_at)}{o.kind === "renewal" && " · ต่ออายุอัตโนมัติ"}</p>
                  </div>
                  <p className="num text-right text-sm font-semibold sm:order-none">{fmtTHB(o.amount_satang)}</p>
                  <p className="text-xs text-muted">
                    {o.status === "paid" ? (o.access_until ? `ใช้ได้ถึง ${fmtDate(o.access_until)}` : o.billing === "one_time" ? "ตลอดชีพ" : "") : ""}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {o.receipt_url && (
                      <a href={o.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                        ใบเสร็จ <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty title="ยังไม่มีประวัติการซื้อ" />
        )}
      </Card>
    </>
  );
}
