import { ExternalLink } from "lucide-react";
import { EmptyLine, Row, Rows, Section, StatRow, Status, TableBox, Td, TextLink, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink, Notice } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { fmtTHB, ORDER_STATUS, orderTerm, SUB_STATUS } from "@/lib/store/pricing";
import type { Order, Subscription } from "@/lib/types";
import { PortalButton, SubscriptionToggle } from "./subscription-actions";

export const metadata = { title: "การชำระเงิน" };

const DOT = { buy: "good", sell: "bad", brand: "warn", info: "neutral", neutral: "neutral" } as const;

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
  const hasAnything = subscriptions.length > 0 || history.length > 0;

  return (
    <>
      <PageHeader
        title="การชำระเงิน"
        description="การสมัครแบบรายงวด ประวัติการซื้อ และใบเสร็จ"
        action={<>{subscriptions.length > 0 && <PortalButton />}<ButtonLink href="/store">ซื้อเพิ่ม</ButtonLink></>}
      />

      <div className="space-y-10">
        {pastDue && <Notice tone="error">มีการสมัครที่ค้างชำระ กรุณาอัปเดตบัตรผ่าน “จัดการบัตรและใบแจ้งหนี้”</Notice>}

        {hasAnything && (
          <StatRow
            items={[
              { label: "การสมัครที่ใช้งานอยู่", value: live.length, hint: ended.length ? `สิ้นสุดแล้ว ${ended.length} รายการ` : undefined },
              { label: "ต่ออายุครั้งถัดไป", value: nextRenewal ? fmtDate(nextRenewal.current_period_end!) : "—", hint: nextRenewal?.product_name ?? "ไม่มีรายการต่ออายุอัตโนมัติ" },
              { label: "รายการที่ชำระแล้ว", value: paidCount, hint: history.length ? `จากทั้งหมด ${history.length} รายการ` : undefined },
            ]}
          />
        )}

        <Section title="การสมัครแบบรายงวด" description="ยกเลิกแล้วยังใช้งานได้จนจบงวดที่จ่ายไว้">
          {live.length ? (
            <Rows>
              {live.map((s) => {
                const st = SUB_STATUS[s.status] ?? { label: s.status, tone: "neutral" as const };
                const end = s.current_period_end ? fmtDate(s.current_period_end) : "—";
                return (
                  <Row key={s.id} className="flex-col items-stretch gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium">
                        {s.product_name}
                        <Status tone={DOT[st.tone]}>{st.label}</Status>
                        {s.cancel_at_period_end && <Status>ไม่ต่ออายุ</Status>}
                      </p>
                      <p className="num mt-1 text-sm text-muted tabular-nums">
                        {fmtTHB(s.amount_satang)}/{s.interval === "year" ? "ปี" : "เดือน"} · {s.codes.join(" · ")} · {s.cancel_at_period_end ? `สิ้นสุด ${end}` : `ต่ออายุ ${end}`}
                      </p>
                      {s.status === "past_due" && <p className="mt-1 text-sm font-medium text-sell">ตัดบัตรไม่สำเร็จ กรุณาอัปเดตบัตรใน Stripe</p>}
                    </div>
                    <SubscriptionToggle id={s.id} cancelAtPeriodEnd={s.cancel_at_period_end} endsOn={end} />
                  </Row>
                );
              })}
            </Rows>
          ) : (
            <EmptyLine action={<TextLink href="/store">ดูแพ็กเกจรายเดือน</TextLink>}>ไม่มีการสมัครแบบรายงวด</EmptyLine>
          )}
          {ended.length > 0 && (
            <p className="border-t border-line px-4 py-3 text-sm text-muted sm:px-5">สิ้นสุดแล้ว: {ended.map((s) => s.product_name).join(", ")}</p>
          )}
        </Section>

        <Section title="ประวัติการซื้อ" description={history.length ? `${history.length} รายการล่าสุด` : undefined}>
          {history.length ? (
            <TableBox minWidth={720} caption="ประวัติการซื้อ">
              <thead className="bg-panel-2">
                <tr>
                  <Th>สินค้า</Th>
                  <Th>วันที่</Th>
                  <Th className="text-right">ยอดชำระ</Th>
                  <Th>สิทธิ์</Th>
                  <Th>สถานะ</Th>
                  <Th className="text-right"><span className="sr-only">การทำงาน</span></Th>
                </tr>
              </thead>
              <tbody>
                {history.map((o) => {
                  const st = ORDER_STATUS[o.status];
                  return (
                    <tr key={o.id} className="border-t border-line">
                      <Td>
                        <p className="font-medium">{o.product_name}</p>
                        <p className="text-sm text-muted">{orderTerm(o)}{o.kind === "renewal" && " · ต่ออายุอัตโนมัติ"}</p>
                      </Td>
                      <Td className="num whitespace-nowrap text-muted tabular-nums">{fmtDateTime(o.paid_at ?? o.created_at)}</Td>
                      <Td className="num text-right font-semibold tabular-nums">{fmtTHB(o.amount_satang)}</Td>
                      <Td className="text-muted">
                        {o.status === "paid" ? (o.access_until ? `ใช้ได้ถึง ${fmtDate(o.access_until)}` : o.billing === "one_time" ? "ตลอดชีพ" : "—") : "—"}
                      </Td>
                      <Td><Status tone={DOT[st.tone]}>{st.label}</Status></Td>
                      <Td>
                        <div className="flex items-center justify-end gap-4">
                          {o.status === "paid" && o.codes.length === 1 && (
                            <TextLink href={`/indicators/${o.codes[0]}#reviews`}>รีวิว<span className="sr-only"> {o.product_name}</span></TextLink>
                          )}
                          {o.receipt_url && (
                            <a href={o.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent underline-offset-4 hover:underline">
                              ใบเสร็จ <ExternalLink aria-hidden className="size-3.5" /><span className="sr-only"> {o.product_name} (เปิดแท็บใหม่)</span>
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
            <EmptyLine>ยังไม่มีประวัติการซื้อ เมื่อชำระเงินแล้วใบเสร็จจะแสดงที่นี่</EmptyLine>
          )}
        </Section>
      </div>
    </>
  );
}
