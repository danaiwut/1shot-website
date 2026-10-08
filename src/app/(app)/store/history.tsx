import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarClock, ExternalLink, Receipt, Repeat, Star } from "lucide-react";
import { CARD, StatRow, Status, TextLink } from "@/components/app/kit";
import { SectionHeading } from "@/components/brand";
import { cx, Notice } from "@/components/ui";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { fmtTHB, ORDER_STATUS, orderTerm, SUB_STATUS } from "@/lib/store/pricing";
import type { createClient } from "@/lib/supabase/server";
import type { Order, Subscription } from "@/lib/types";
import { PortalButton, SubscriptionToggle } from "./subscription-actions";

type Client = Awaited<ReturnType<typeof createClient>>;

const DOT = { buy: "good", sell: "bad", brand: "warn", info: "neutral", neutral: "neutral" } as const;

/** /store "ประวัติ": subscriptions as cards, purchases as receipt rows. */
export async function PurchaseHistory({ supabase, userId }: { supabase: Client; userId: string }) {
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
    <section id="history" aria-labelledby="history-title" className="scroll-mt-24">
      <SectionHeading
        id="history-title" eyebrow="ประวัติ" title="การซื้อและใบเสร็จ" description="การสมัครแบบรายงวด ประวัติการซื้อ และใบเสร็จ"
        action={subscriptions.length > 0 && <PortalButton />} className="mb-8"
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

        <div>
          <Heading title="การสมัครแบบรายงวด" line="ยกเลิกแล้วยังใช้งานได้จนจบงวดที่จ่ายไว้" />
          {live.length ? (
            <ul className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {live.map((s) => {
                const st = SUB_STATUS[s.status] ?? { label: s.status, tone: "neutral" as const };
                const end = s.current_period_end ? fmtDate(s.current_period_end) : "—";
                return (
                  <li key={s.id} className={cx(CARD, "flex flex-col p-5 sm:p-6", s.status === "past_due" && "border-sell/50")}>
                    <div className="flex items-start gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-dim text-accent"><Repeat aria-hidden className="size-5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{s.product_name}</p>
                        <p className="mt-1 flex flex-wrap gap-1.5">
                          <Status tone={DOT[st.tone]}>{st.label}</Status>
                          {s.cancel_at_period_end && <Status>ไม่ต่ออายุ</Status>}
                        </p>
                      </div>
                    </div>
                    <p className="mt-5 flex items-baseline gap-1">
                      <span className="num text-3xl font-black tracking-tight tabular-nums">{fmtTHB(s.amount_satang)}</span>
                      <span className="text-sm text-muted">/{s.interval === "year" ? "ปี" : "เดือน"}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.codes.map((c) => <span key={c} className="num rounded-full bg-panel-3 px-2.5 py-0.5 text-xs font-bold">{c}</span>)}
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                      <CalendarClock aria-hidden className="size-4 shrink-0" />
                      {s.cancel_at_period_end ? `สิ้นสุด ${end}` : `ต่ออายุอัตโนมัติ ${end}`}
                    </p>
                    {s.status === "past_due" && <p className="mt-2 text-sm font-medium text-sell">ตัดบัตรไม่สำเร็จ กรุณาอัปเดตบัตรใน Stripe</p>}
                    <div className="mt-auto border-t border-line pt-4">
                      <SubscriptionToggle id={s.id} cancelAtPeriodEnd={s.cancel_at_period_end} endsOn={end} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>ไม่มีการสมัครแบบรายงวด <TextLink href="#deals">ดูแพ็กเกจรายเดือน</TextLink></Empty>
          )}
          {ended.length > 0 && <p className="mt-3 text-sm text-muted">สิ้นสุดแล้ว: {ended.map((s) => s.product_name).join(", ")}</p>}
        </div>

        <div>
          <Heading title="ประวัติการซื้อ" line={history.length ? `${history.length} รายการล่าสุด` : undefined} />
          {history.length ? (
            <ul className={cx(CARD, "divide-y divide-line")}>
              {history.map((o) => {
                const st = ORDER_STATUS[o.status];
                const paid = o.status === "paid";
                return (
                  <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors hover:bg-panel-3/60 sm:px-6">
                    <span className={cx("grid size-11 shrink-0 place-items-center rounded-xl", paid ? "bg-buy-dim text-buy" : "bg-panel-3 text-muted")}><Receipt aria-hidden className="size-5" /></span>
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">{o.product_name}<Status tone={DOT[st.tone]}>{st.label}</Status></p>
                      <p className="mt-0.5 text-sm text-muted">
                        <span className="num tabular-nums">{fmtDateTime(o.paid_at ?? o.created_at)}</span> · {orderTerm(o)}{o.kind === "renewal" && " · ต่ออายุอัตโนมัติ"}
                        {paid && (o.access_until ? ` · ใช้ได้ถึง ${fmtDate(o.access_until)}` : o.billing === "one_time" ? " · ตลอดชีพ" : "")}
                      </p>
                    </div>
                    <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                      <span className="num text-lg font-black tabular-nums">{fmtTHB(o.amount_satang)}</span>
                      <span className="flex items-center gap-2">
                        {paid && o.codes.length === 1 && (
                          <Link href={`/store/${o.codes[0]}#reviews`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-medium hover:border-line-strong">
                            <Star aria-hidden className="size-3.5" />รีวิว<span className="sr-only"> {o.product_name}</span>
                          </Link>
                        )}
                        {o.receipt_url && (
                          <a href={o.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-dim px-3.5 text-sm font-semibold text-accent hover:bg-brand/15">
                            ใบเสร็จ <ExternalLink aria-hidden className="size-3.5" /><span className="sr-only"> {o.product_name} (เปิดแท็บใหม่)</span>
                          </a>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>ยังไม่มีประวัติการซื้อ เมื่อชำระเงินแล้วใบเสร็จจะแสดงที่นี่</Empty>
          )}
        </div>
      </div>
    </section>
  );
}

function Heading({ title, line }: { title: string; line?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h3 className="text-xl font-black tracking-tight">{title}<span className="text-brand">.</span></h3>
      {line && <p className="text-sm text-muted">{line}</p>}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-3 rounded-2xl border border-dashed border-line-strong bg-panel px-5 py-6 text-sm text-muted">{children}</div>;
}
