import { Activity, CheckCircle2, Clock, Send, XCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
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
  const tone = paid ? "bg-buy-dim text-buy" : failed ? "bg-sell-dim text-sell" : "bg-brand-dim text-accent";

  return (
    <div className="mx-auto w-full max-w-xl pt-2 sm:pt-6">
      {!paid && !failed && <Refresher />}
      <Card className="gap-0 overflow-hidden rounded-2xl py-0 shadow-xs">
        <CardHeader className="items-center justify-items-center gap-3 border-b border-line bg-gradient-to-b from-brand-dim/40 to-panel px-6 py-8 text-center">
          <span aria-hidden className={`grid size-16 place-items-center rounded-full ${tone}`}>
            <Icon className="size-8" strokeWidth={1.8} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            {paid ? "ชำระเงินสำเร็จ" : failed ? "การชำระเงินไม่สำเร็จ" : "กำลังยืนยันการชำระเงิน…"}
          </h1>
          <CardDescription role="status" className="text-sm text-muted">
            {paid ? "สิทธิ์ของคุณพร้อมใช้งานแล้ว" : failed ? "ยังไม่มีการตัดเงิน ลองชำระใหม่ได้" : "หน้านี้จะอัปเดตเองเมื่อได้รับการยืนยันจาก Stripe"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <h2 className="sr-only">รายละเอียดคำสั่งซื้อ</h2>
          <dl className="divide-y divide-line text-sm">
            <Row k="สินค้า" v={`${order.product_name} · ${orderTerm(order)}`} />
            <Row k="ยอดชำระ" v={<span className="num font-semibold">{fmtTHB(order.amount_satang)}</span>} />
            <Row k="อินดิเคเตอร์" v={<span className="num">{order.codes.join(" · ")}</span>} />
            {paid && <Row k="ใช้ได้ถึง" v={order.access_until ? fmtDate(order.access_until) : order.billing === "one_time" ? "ตลอดชีพ" : "—"} />}
          </dl>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 border-t border-line bg-panel-2/40 px-6 py-4 sm:flex-row">
          {paid ? (
            <>
              <ButtonLink href="/signals" className="w-full sm:flex-1"><Activity aria-hidden className="size-4" /> ดูสัญญาณ</ButtonLink>
              <ButtonLink href="/account#telegram" variant="outline" className="w-full sm:flex-1"><Send aria-hidden className="size-4" /> เข้าห้อง Telegram</ButtonLink>
            </>
          ) : (
            <ButtonLink href="/store" variant={failed ? "brand" : "outline"} className="w-full sm:flex-1">กลับไปร้านค้า</ButtonLink>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-3.5">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
