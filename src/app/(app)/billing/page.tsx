import Link from "next/link";
import { CalendarClock, ExternalLink, Receipt, Repeat, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Badge, ButtonLink, Empty } from "@/components/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireViewer } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { fmtTHB, ORDER_STATUS, orderTerm, SUB_STATUS } from "@/lib/store/pricing";
import type { Order, Subscription } from "@/lib/types";
import { Section } from "../_components/section";
import { PortalButton, SubscriptionToggle } from "./subscription-actions";

export const metadata = { title: "การชำระเงิน" };

const linkCls = "inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent underline underline-offset-4";

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
  const paidCount = history.filter((o) => o.status === "paid").length;
  const nextRenewal = live
    .filter((s) => s.current_period_end && !s.cancel_at_period_end)
    .sort((a, b) => a.current_period_end!.localeCompare(b.current_period_end!))[0];
  const pastDue = live.some((s) => s.status === "past_due" || s.status === "unpaid");

  return (
    <>
      <PageHeader
        eyebrow="บิลและใบเสร็จ"
        title="การชำระเงิน"
        description="การสมัครแบบรายงวด ประวัติการซื้อ และใบเสร็จ"
        action={<>{subscriptions.length > 0 && <PortalButton />}<ButtonLink href="/store"><ShoppingBag aria-hidden className="size-4" /> ซื้อเพิ่ม</ButtonLink></>}
      />

      <section aria-label="สรุปการชำระเงิน" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard
          icon={Repeat} label="การสมัครที่ใช้งานอยู่" value={`${live.length}`} tone={pastDue ? "alert" : "default"}
          badge={pastDue ? <Badge tone="sell">ค้างชำระ</Badge> : undefined}
          foot={ended.length ? `สิ้นสุดแล้ว ${ended.length} รายการ` : "รายเดือน / รายปี"}
        />
        <StatCard
          icon={CalendarClock} label="ต่ออายุครั้งถัดไป"
          value={nextRenewal ? fmtDate(nextRenewal.current_period_end!) : "—"}
          foot={nextRenewal ? nextRenewal.product_name : "ไม่มีรายการที่จะต่ออายุอัตโนมัติ"}
          className="[&_[data-slot=card-title]]:text-2xl"
        />
        <StatCard icon={Receipt} label="รายการที่ชำระแล้ว" value={`${paidCount}`} foot={history.length ? `จากทั้งหมด ${history.length} รายการ` : "ยังไม่มีประวัติ"} />
      </section>

      <Section title="การสมัครแบบรายงวด" description="ยกเลิกแล้วยังใช้งานได้จนจบงวดที่จ่ายไว้" className="mb-6">
        {live.length ? (
          <ul className="divide-y divide-line">
            {live.map((s) => {
              const st = SUB_STATUS[s.status] ?? { label: s.status, tone: "neutral" as const };
              const end = s.current_period_end ? fmtDate(s.current_period_end) : "—";
              return (
                <li key={s.id} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-dim text-accent"><Repeat className="size-4" /></span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {s.product_name}
                        <Badge tone={st.tone}>{st.label}</Badge>
                        {s.cancel_at_period_end && <Badge>ไม่ต่ออายุ</Badge>}
                      </p>
                      <p className="num mt-1 text-sm text-muted">
                        {fmtTHB(s.amount_satang)}/{s.interval === "year" ? "ปี" : "เดือน"} · {s.codes.join(" · ")}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {s.cancel_at_period_end ? `สิ้นสุด ${end}` : `ต่ออายุครั้งถัดไป ${end}`}
                      </p>
                      {s.status === "past_due" && <p className="mt-1 text-sm font-medium text-sell">ตัดบัตรไม่สำเร็จ กรุณาอัปเดตบัตรใน Stripe</p>}
                    </div>
                  </div>
                  <SubscriptionToggle id={s.id} cancelAtPeriodEnd={s.cancel_at_period_end} endsOn={end} />
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty title="ไม่มีการสมัครแบบรายงวด"><Link href="/store" className={linkCls}>ดูแพ็กเกจรายเดือน</Link></Empty>
        )}
        {ended.length > 0 && (
          <p className="border-t border-line bg-panel-2/40 px-6 py-3 text-xs text-muted">สิ้นสุดแล้ว: {ended.map((s) => s.product_name).join(", ")}</p>
        )}
      </Section>

      <Section title="ประวัติการซื้อ" description={history.length ? `${history.length} รายการล่าสุด` : undefined}>
        {history.length ? (
          <Table className="min-w-[720px]">
            <TableHeader className="bg-panel-2/60">
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="h-11 pl-6 text-muted">สินค้า</TableHead>
                <TableHead className="h-11 text-muted">วันที่</TableHead>
                <TableHead className="h-11 text-right text-muted">ยอดชำระ</TableHead>
                <TableHead className="h-11 text-muted">สิทธิ์</TableHead>
                <TableHead className="h-11 text-muted">สถานะ</TableHead>
                <TableHead className="h-11 pr-6 text-right text-muted"><span className="sr-only">การทำงาน</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((o) => {
                const st = ORDER_STATUS[o.status];
                return (
                  <TableRow key={o.id} className="border-line hover:bg-panel-2/60">
                    <TableCell className="py-3 pl-6">
                      <p className="font-medium">{o.product_name}</p>
                      <p className="text-xs text-muted">{orderTerm(o)}{o.kind === "renewal" && " · ต่ออายุอัตโนมัติ"}</p>
                    </TableCell>
                    <TableCell className="num text-muted">{fmtDateTime(o.paid_at ?? o.created_at)}</TableCell>
                    <TableCell className="num text-right font-semibold tabular-nums">{fmtTHB(o.amount_satang)}</TableCell>
                    <TableCell className="text-muted">
                      {o.status === "paid" ? (o.access_until ? `ใช้ได้ถึง ${fmtDate(o.access_until)}` : o.billing === "one_time" ? "ตลอดชีพ" : "—") : "—"}
                    </TableCell>
                    <TableCell><Badge tone={st.tone}>{st.label}</Badge></TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-4">
                        {o.status === "paid" && o.codes.length === 1 && (
                          <Link href={`/indicators/${o.codes[0]}#reviews`} className={linkCls}>รีวิว<span className="sr-only"> {o.product_name}</span></Link>
                        )}
                        {o.receipt_url && (
                          <a href={o.receipt_url} target="_blank" rel="noopener noreferrer" className={linkCls}>
                            ใบเสร็จ <ExternalLink aria-hidden className="size-3.5" /><span className="sr-only"> {o.product_name} (เปิดแท็บใหม่)</span>
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
          <Empty title="ยังไม่มีประวัติการซื้อ">เมื่อชำระเงินแล้ว ใบเสร็จจะแสดงที่นี่</Empty>
        )}
      </Section>
    </>
  );
}
