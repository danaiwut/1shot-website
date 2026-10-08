import Link from "next/link";
import { ExternalLink, Receipt, Repeat } from "lucide-react";
import { Section, Segmented, StatRow, TableBox, Td, TextLink, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { Badge, ButtonLink, cx, FilterLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { fmtTHB, ORDER_STATUS, orderTerm, SUB_STATUS } from "@/lib/store/pricing";
import type { Order, OrderStatus, Subscription } from "@/lib/types";
import { ToneStatus } from "../_components/tone-status";
import { EmptyState, matches, one, qs, ROW_ACTION, Toolbar } from "@/components/app/toolbar";
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
  const q = one(sp.q);
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
  const loaded = (orders ?? []) as WithUser<Order>[];
  const rows = loaded.filter((o) => matches(q, o.profiles?.display_name, o.profiles?.email, o.product_name, o.id, o.stripe_payment_intent_id));
  const filtered = status !== "all" || Boolean(q);

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
          title={<>รายการคำสั่งซื้อ <span className="num ml-1 text-sm font-normal text-muted tabular-nums">{rows.length} รายการ</span></>}
          description={`ล่าสุดก่อน${loaded.length === 200 ? " · แสดงสูงสุด 200 รายการ" : ""}`}
        >
          <Toolbar q={q} placeholder="ชื่อ อีเมล หรือสินค้า" keep={{ status: status === "all" ? undefined : status }}>
            <Segmented label="กรองคำสั่งซื้อตามสถานะ">
              {FILTERS.map((f) => (
                <FilterLink key={f.id} href={qs("/admin/orders", { status: f.id === "all" ? undefined : f.id, q })} on={status === f.id}>{f.label}</FilterLink>
              ))}
            </Segmented>
          </Toolbar>
          {rows.length ? (
            <TableBox caption={`คำสั่งซื้อ ${rows.length} รายการ`} minWidth={640}>
              <thead>
                <tr>
                  <Th>ลูกค้า</Th>
                  <Th>สินค้า</Th>
                  <Th className="hidden lg:table-cell">วันที่</Th>
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
                        <Link href={`/admin/members/${o.user_id}`} className="group flex min-h-11 flex-col justify-center">
                          <span className="font-bold group-hover:text-accent group-hover:underline">{o.profiles?.display_name || o.profiles?.email?.split("@")[0] || "—"}</span>
                          <span className="text-xs text-muted">{o.profiles?.email}</span>
                        </Link>
                      </Td>
                      <Td>
                        <span className="font-medium">{o.product_name}</span>
                        <span className="block text-xs text-muted">
                          {orderTerm(o)}{o.kind === "renewal" && " · ต่ออายุ"}
                          <span className="num lg:hidden"> · {fmtDateTime(o.created_at)}</span>
                        </span>
                      </Td>
                      <Td className="num hidden whitespace-nowrap text-muted tabular-nums lg:table-cell">{fmtDateTime(o.created_at)}</Td>
                      <Td className={cx("num text-right font-bold whitespace-nowrap tabular-nums", (o.status === "refunded" || o.status === "canceled") && "text-muted line-through decoration-1")}>{fmtTHB(o.amount_satang)}</Td>
                      <Td><ToneStatus tone={st.tone}>{st.label}</ToneStatus></Td>
                      <Td>
                        <div className="flex items-center justify-end gap-2">
                          {o.status === "paid" && <RefundButton orderId={o.id} label={`${fmtTHB(o.amount_satang)} · ${o.product_name}`} />}
                          {o.stripe_payment_intent_id && (
                            <a href={`${stripeBase}/payments/${o.stripe_payment_intent_id}`} target="_blank" rel="noopener noreferrer" className={ROW_ACTION} aria-label={`เปิดคำสั่งซื้อ ${o.product_name} ใน Stripe (เปิดแท็บใหม่)`}>
                              Stripe <ExternalLink aria-hidden className="size-3.5" />
                            </a>
                          )}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableBox>
          ) : filtered ? (
            <EmptyState icon={<Receipt />} title="ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข" action={<TextLink href="/admin/orders">ล้างตัวกรองและการค้นหา</TextLink>}>
              ลองเปลี่ยนสถานะ หรือค้นด้วยอีเมลลูกค้าแทน
            </EmptyState>
          ) : (
            <EmptyState icon={<Receipt />} title="ยังไม่มีคำสั่งซื้อ" action={<ButtonLink href="/admin/products" variant="outline" className="rounded-full">ไปตั้งราคาสินค้า</ButtonLink>}>
              เมื่อลูกค้าชำระเงินผ่าน Stripe รายการจะขึ้นที่นี่ทันที
            </EmptyState>
          )}
        </Section>

        <Section
          title={<>การสมัครแบบรายงวด <span className="num ml-1 text-sm font-normal text-muted tabular-nums">{activeSubs.length} ใช้งานอยู่</span></>}
          description="ตัดบัตรอัตโนมัติผ่าน Stripe · 100 รายการล่าสุด"
        >
          {subscriptions.length ? (
            <TableBox caption="การสมัครแบบรายงวด" minWidth={600}>
              <thead>
                <tr>
                  <Th>ลูกค้า</Th>
                  <Th>แพ็กเกจ</Th>
                  <Th className="text-right">ยอดต่อรอบ</Th>
                  <Th className="hidden md:table-cell">รอบถัดไป</Th>
                  <Th>สถานะ</Th>
                  <Th className="text-right"><span className="sr-only">Stripe</span></Th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => {
                  const st = SUB_STATUS[s.status] ?? { label: s.status, tone: "neutral" as const };
                  const next = s.current_period_end && s.status !== "canceled" ? `${s.cancel_at_period_end ? "สิ้นสุด" : "ต่ออายุ"} ${fmtDate(s.current_period_end)}` : null;
                  return (
                    <tr key={s.id} className="border-t border-line">
                      <Td>
                        <Link href={`/admin/members/${s.user_id}`} className="group flex min-h-11 flex-col justify-center">
                          <span className="font-bold group-hover:text-accent group-hover:underline">{s.profiles?.display_name || s.profiles?.email?.split("@")[0] || "—"}</span>
                          <span className="text-xs text-muted">{s.profiles?.email}</span>
                        </Link>
                      </Td>
                      <Td>
                        <span className="font-medium">{s.product_name}</span>
                        {next && <span className="block text-xs text-muted md:hidden">{next}</span>}
                      </Td>
                      <Td className="num text-right whitespace-nowrap tabular-nums">
                        <span className="font-bold">{fmtTHB(s.amount_satang)}</span>
                        <span className="text-xs text-muted">/{s.interval === "year" ? "ปี" : "เดือน"}</span>
                      </Td>
                      <Td className="hidden text-muted md:table-cell">{next ?? <span className="text-faint">—</span>}</Td>
                      <Td>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <ToneStatus tone={st.tone}>{st.label}</ToneStatus>
                          {s.cancel_at_period_end && <Badge>ไม่ต่ออายุ</Badge>}
                        </span>
                      </Td>
                      <Td className="text-right">
                        <a href={`${stripeBase}/subscriptions/${s.id}`} target="_blank" rel="noopener noreferrer" className={ROW_ACTION} aria-label={`เปิดการสมัคร ${s.product_name} ใน Stripe (เปิดแท็บใหม่)`}>
                          Stripe <ExternalLink aria-hidden className="size-3.5" />
                        </a>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableBox>
          ) : (
            <EmptyState icon={<Repeat />} title="ยังไม่มีการสมัครแบบรายงวด">
              เพิ่มราคาแบบ “รายงวด” ให้สินค้า แล้วลูกค้าจะสมัครแบบตัดบัตรอัตโนมัติได้
            </EmptyState>
          )}
        </Section>
      </div>
    </>
  );
}
