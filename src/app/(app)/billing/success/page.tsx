import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { ButtonLink, Card } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { fmtTHB, orderTerm } from "@/lib/store/pricing";
import type { Order } from "@/lib/types";
import { Refresher } from "./refresher";

export const metadata = { title: "ผลการชำระเงิน" };

export default async function SuccessPage({ searchParams }: PageProps<"/billing/success">) {
  const { order: id } = await searchParams;
  if (typeof id !== "string") notFound();
  const { supabase, userId } = await requireViewer();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).eq("user_id", userId).maybeSingle<Order>();
  if (!order) notFound();

  const paid = order.status === "paid";
  const failed = order.status === "failed" || order.status === "canceled";
  const Icon = paid ? CheckCircle2 : failed ? XCircle : Clock;

  return (
    <div className="mx-auto max-w-lg pt-6">
      {!paid && !failed && <Refresher />}
      <Card className="overflow-hidden text-center">
        <div className={`surface-dark relative px-6 pt-10 pb-8 ${paid ? "bg-ink" : "bg-ink"}`}>
          <div className="brand-glow pointer-events-none absolute inset-0 opacity-70" />
          <Icon aria-hidden className={`relative mx-auto size-14 ${paid ? "text-buy" : failed ? "text-sell" : "text-accent"}`} strokeWidth={1.6} />
          <h1 className="relative mt-4 text-2xl font-bold tracking-tight">
            {paid ? "ชำระเงินสำเร็จ" : failed ? "การชำระเงินไม่สำเร็จ" : "กำลังยืนยันการชำระเงิน…"}
          </h1>
          <p className="relative mt-1 text-sm text-muted">
            {paid ? "สิทธิ์ของคุณพร้อมใช้งานแล้ว" : failed ? "ยังไม่มีการตัดเงิน ลองชำระใหม่ได้" : "หน้านี้จะอัปเดตเองเมื่อได้รับการยืนยันจาก Stripe"}
          </p>
        </div>
        <dl className="divide-y divide-line text-left text-sm">
          <Row k="สินค้า" v={`${order.product_name} · ${orderTerm(order)}`} />
          <Row k="ยอดชำระ" v={<span className="num font-semibold">{fmtTHB(order.amount_satang)}</span>} />
          <Row k="อินดิเคเตอร์" v={<span className="num">{order.codes.join(" · ")}</span>} />
          {paid && <Row k="ใช้ได้ถึง" v={order.access_until ? fmtDate(order.access_until) : order.billing === "one_time" ? "ตลอดชีพ" : "—"} />}
        </dl>
        <div className="flex flex-col gap-2 border-t border-line p-4 sm:flex-row">
          {paid ? (
            <>
              <ButtonLink href="/signals" className="flex-1">ดูสัญญาณ</ButtonLink>
              <ButtonLink href="/account#telegram" variant="outline" className="flex-1">เข้าห้อง Telegram</ButtonLink>
            </>
          ) : (
            <ButtonLink href="/store" variant={failed ? "brand" : "outline"} className="flex-1">กลับไปร้านค้า</ButtonLink>
          )}
        </div>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
