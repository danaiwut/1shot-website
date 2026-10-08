import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Loader2, MessageCircle, Receipt, RotateCcw, Send, Store, TrendingUp, X, type LucideIcon } from "lucide-react";
import { CARD } from "@/components/app/kit";
import { Dot } from "@/components/brand";
import { cx } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
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
  const Icon = paid ? Check : failed ? X : Loader2;

  const next: { href: string; icon: LucideIcon; t: string; d: string }[] = paid
    ? [
        { href: "/signals", icon: TrendingUp, t: "ดูสัญญาณ", d: "สัญญาณล่าสุดจากอินดิเคเตอร์ของคุณ" },
        { href: "/account#telegram", icon: Send, t: "เข้าห้อง Telegram", d: "เชื่อมบัญชีแล้วรับลิงก์ห้องสมาชิก" },
        { href: "/store#history", icon: Receipt, t: "ดูประวัติและใบเสร็จ", d: "ใบเสร็จและสิทธิ์ทั้งหมดของคุณ" },
      ]
    : failed
      ? [
          { href: "/store", icon: RotateCcw, t: "ลองชำระใหม่", d: "กลับไปร้านค้าแล้วเลือกแพ็กเกจอีกครั้ง" },
          { href: "/support?kind=help", icon: MessageCircle, t: "ติดต่อทีมงาน", d: "ถ้าถูกตัดเงินแต่สถานะไม่สำเร็จ แจ้งเราได้" },
          { href: "/store#history", icon: Receipt, t: "ดูประวัติการซื้อ", d: "ตรวจรายการทั้งหมดของคุณ" },
        ]
      : [
          { href: "/store#history", icon: Receipt, t: "ดูประวัติการซื้อ", d: "รายการจะขึ้นเมื่อยืนยันเสร็จ" },
          { href: "/store", icon: Store, t: "กลับไปร้านค้า", d: "ปิดหน้านี้ได้ ระบบยืนยันให้เอง" },
        ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pt-2 sm:pt-6">
      {!paid && !failed && <Refresher />}

      <header className="relative overflow-hidden rounded-3xl border border-line bg-ink dark:border-white/10 px-6 py-10 text-center text-fg shadow-[0_30px_80px_-40px_rgb(178_0_22/0.35)] dark:shadow-[0_30px_80px_-40px_rgb(178_0_22/0.6)] sm:px-10 sm:py-14">
        <div aria-hidden className="pointer-events-none absolute -top-28 left-1/2 size-96 -translate-x-1/2 rounded-full bg-brand/15 dark:bg-brand/40 blur-[120px]" />
        <div className="relative">
          <span className={cx(
            "mx-auto grid size-20 place-items-center rounded-full ring-8",
            paid ? "bg-buy text-white ring-buy/20" : failed ? "bg-sell text-white ring-sell/20" : "bg-brand text-white ring-brand/25",
          )}>
            <Icon aria-hidden className={cx("size-10", !paid && !failed && "animate-spin")} strokeWidth={3} />
          </span>
          <p className="mt-6 text-sm font-bold text-accent">{paid ? "ขอบคุณที่ไว้วางใจ" : failed ? "ยังไม่มีการตัดเงิน" : "รอ Stripe ยืนยัน"}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            {paid ? "ชำระเงินสำเร็จ" : failed ? "การชำระเงินไม่สำเร็จ" : "กำลังยืนยันการชำระเงิน"}<Dot />
          </h1>
          <p role="status" className="mx-auto mt-3 max-w-md text-base text-muted sm:text-lg">
            {paid ? "สิทธิ์ของคุณพร้อมใช้งานแล้วใน TradingView" : failed ? "ลองชำระใหม่ได้ หรือเลือกวิธีชำระอื่น" : "หน้านี้จะอัปเดตเองเมื่อได้รับการยืนยัน (PromptPay อาจใช้เวลาสักครู่)"}
          </p>
          <p className="num mt-6 text-4xl font-black tracking-tight tabular-nums">{fmtTHB(order.amount_satang)}</p>
        </div>
      </header>

      <section aria-labelledby="order-title" className={cx(CARD, "p-5 sm:p-6")}>
        <h2 id="order-title" className="text-lg font-bold tracking-tight">รายละเอียดคำสั่งซื้อ</h2>
        <dl className="mt-3 divide-y divide-line text-sm">
          <Item k="สินค้า" v={order.product_name} />
          <Item k="ระยะเวลา" v={orderTerm(order)} />
          <Item k="อินดิเคเตอร์" v={<span className="flex flex-wrap justify-end gap-1.5">{order.codes.map((c) => <span key={c} className="num rounded-full bg-panel-3 px-2.5 py-0.5 text-xs font-bold">{c}</span>)}</span>} />
          <Item k="ยอดชำระ" v={<span className="num font-bold tabular-nums">{fmtTHB(order.amount_satang)}</span>} />
          <Item k="วันที่" v={<span className="num tabular-nums">{fmtDateTime(order.paid_at ?? order.created_at)}</span>} />
          {paid && <Item k="ใช้ได้ถึง" v={order.access_until ? fmtDate(order.access_until) : order.billing === "one_time" ? "ตลอดชีพ" : "—"} />}
          {order.receipt_url && (
            <Item k="ใบเสร็จ" v={<a href={order.receipt_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline-offset-4 hover:underline">เปิดใบเสร็จ<span className="sr-only"> (เปิดแท็บใหม่)</span></a>} />
          )}
        </dl>
      </section>

      <nav aria-label="ทำอะไรต่อ" className={cx("grid gap-4", next.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {next.map((a, i) => (
          <Link
            key={a.href + a.t} href={a.href}
            className={cx(
              "group flex flex-col gap-4 rounded-2xl border p-5 shadow-[0_20px_60px_-40px_rgb(0_0_0/0.35)] transition-[border-color,transform] duration-300 hover:-translate-y-1 focus-visible:border-brand",
              i === 0 ? "border-brand bg-brand text-white" : "border-line bg-panel hover:border-brand/50",
            )}
          >
            <span className={cx("grid size-11 place-items-center rounded-xl", i === 0 ? "bg-white/15" : "bg-brand-dim text-accent")}><a.icon aria-hidden className="size-5" /></span>
            <span>
              <span className="flex items-center gap-1.5 font-bold">{a.t}<ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
              <span className={cx("mt-1 block text-sm", i === 0 ? "text-white/80" : "text-muted")}>{a.d}</span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Item({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-muted">{k}</dt>
      <dd className="min-w-0 text-right font-medium">{v}</dd>
    </div>
  );
}
