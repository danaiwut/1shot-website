import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Section } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui";
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

  return (
    <div className="mx-auto w-full max-w-xl pt-2 sm:pt-6">
      {!paid && !failed && <Refresher />}
      <PageHeader
        title={paid ? "ชำระเงินสำเร็จ" : failed ? "การชำระเงินไม่สำเร็จ" : "กำลังยืนยันการชำระเงิน…"}
        description={
          <span role="status">
            {paid ? "สิทธิ์ของคุณพร้อมใช้งานแล้ว" : failed ? "ยังไม่มีการตัดเงิน ลองชำระใหม่ได้" : "หน้านี้จะอัปเดตเองเมื่อได้รับการยืนยันจาก Stripe"}
          </span>
        }
      />

      <div className="space-y-6">
        <Section title="รายละเอียดคำสั่งซื้อ">
          <dl className="divide-y divide-line text-sm">
            <Item k="สินค้า" v={`${order.product_name} · ${orderTerm(order)}`} />
            <Item k="ยอดชำระ" v={<span className="num font-semibold tabular-nums">{fmtTHB(order.amount_satang)}</span>} />
            <Item k="อินดิเคเตอร์" v={<span className="num">{order.codes.join(" · ")}</span>} />
            {paid && <Item k="ใช้ได้ถึง" v={order.access_until ? fmtDate(order.access_until) : order.billing === "one_time" ? "ตลอดชีพ" : "—"} />}
          </dl>
        </Section>

        <div className="flex flex-col gap-2 sm:flex-row">
          {paid ? (
            <>
              <ButtonLink href="/signals" className="w-full sm:flex-1">ดูสัญญาณ</ButtonLink>
              <ButtonLink href="/account#telegram" variant="outline" className="w-full sm:flex-1">เข้าห้อง Telegram</ButtonLink>
            </>
          ) : (
            <ButtonLink href="/store" variant={failed ? "brand" : "outline"} className="w-full sm:flex-1">กลับไปร้านค้า</ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
