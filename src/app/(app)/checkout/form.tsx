"use client";
import { useActionState, useState, useTransition, type ReactNode } from "react";
import { CandlestickChart, Check, CreditCard, Hash, Loader2, Lock, Mail, QrCode, ShieldCheck } from "lucide-react";
import { DealPicker, pickCompare } from "@/components/store/deal-picker";
import { cx } from "@/components/ui";
import { checkTradingViewName, startCheckout, type CheckoutState } from "@/lib/store/actions";
import { savingPercent } from "@/lib/store/offers";
import { fmtTHB } from "@/lib/store/pricing";

type Order = { name: string; term: string; subscription: boolean; amount: number; codes: string[]; until: string | null };
type Item = { name: string; image: string | null; family: string };
type Pick = { count: number; chosen: string[]; owned: string[] };

/** Checkout: customer details on the left, the order with one pay button on the right (one form). */
export function CheckoutForm({ priceId, tradingview, account, email, order, items, parts, pick }: {
  priceId: string; tradingview: string; account: string; email: string;
  order: Order; items: Record<string, Item>; parts: Record<string, number>; pick?: Pick;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});
  const [chosen, setChosen] = useState<string[]>(pick?.chosen ?? []);
  const [tv, setTv] = useState<{ ok: boolean; message: string } | null>(null);
  const [checking, start] = useTransition();
  const check = (value: string) => {
    if (!value.trim()) return setTv(null);
    start(async () => setTv(await checkTradingViewName(value)));
  };
  const err = (f: CheckoutState["field"]) => (state.field === f ? state.error : undefined);

  const ready = !pick || chosen.length === pick.count;
  const shown = pick ? chosen : order.codes;
  const compare = pick ? (ready ? pickCompare(parts, chosen, order.amount) : null)
    : order.codes.length > 1 && order.codes.every((c) => c in parts) ? (() => { const s = order.codes.reduce((t, c) => t + parts[c], 0); return s > order.amount ? s : null; })() : null;
  const off = savingPercent(compare, order.amount);

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-0">
      <input type="hidden" name="price_id" value={priceId} />

      {/* Left: details */}
      <div className="min-w-0 lg:border-r lg:border-line lg:pr-12">
        <ol className="grid grid-cols-2 text-sm font-medium">
          <li className="flex items-center gap-2.5 border-b-2 border-brand pb-3 text-fg"><span className="grid size-6 place-items-center rounded-full bg-brand text-white"><Check aria-hidden className="size-3.5" strokeWidth={3} /></span>ข้อมูลของคุณ</li>
          <li className="flex items-center gap-2.5 border-b-2 border-line pb-3 text-muted"><span className="num grid size-6 place-items-center rounded-full bg-panel-3 text-xs">2</span>ชำระเงิน</li>
        </ol>

        <h1 className="mt-9 text-2xl font-bold tracking-tight sm:text-3xl">ยืนยันข้อมูลก่อนชำระเงิน</h1>
        <p className="mt-2 text-sm text-muted">ระบบใช้ข้อมูลนี้เปิดสิทธิ์อินดิเคเตอร์ให้คุณใน TradingView อัตโนมัติหลังชำระเงินสำเร็จ</p>

        {pick && (
          <section className="mt-8">
            <h2 className="mb-3 text-base font-semibold">เลือกอินดิเคเตอร์</h2>
            <DealPicker pool={order.codes.map((code) => ({ code, name: items[code]?.name ?? code }))} count={pick.count} chosen={chosen} onChange={setChosen} owned={pick.owned} />
            {err("codes") && <p role="alert" className="mt-2 text-sm text-sell">{err("codes")}</p>}
          </section>
        )}

        <section className="mt-8 space-y-3">
          <h2 className="mb-1 text-base font-semibold">ข้อมูลบัญชี</h2>
          <BoxField
            icon={<CandlestickChart aria-hidden className="size-5" />} label="ชื่อผู้ใช้ TradingView" name="tradingview" defaultValue={tradingview}
            onBlur={(v) => check(v)} autoComplete="off" spellCheck={false}
            hint={checking ? "กำลังตรวจกับ TradingView…" : tv?.message ?? "ระบบจะเปิดสิทธิ์ให้ชื่อนี้ใน TradingView"}
            hintTone={tv ? (tv.ok ? "good" : tv.message.startsWith("ไม่พบ") ? "bad" : undefined) : undefined}
            error={err("tradingview")}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <BoxField icon={<Hash aria-hidden className="size-5" />} label="เลขบัญชีเทรด (MT5)" name="account" defaultValue={account} inputMode="numeric" hint="เช่น บัญชี Exness" error={err("account")} />
            <BoxField icon={<Mail aria-hidden className="size-5" />} label="อีเมลรับใบเสร็จ" name="email" type="email" defaultValue={email} autoComplete="email" error={err("email")} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-base font-semibold">วิธีชำระเงิน</h2>
          <p className="mt-1 text-sm text-muted">เลือกได้ในหน้าถัดไปของ Stripe ข้อมูลบัตรไม่ผ่านเว็บเรา</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li className="flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-4">
              <span className="grid size-10 place-items-center rounded-lg bg-panel-3"><CreditCard aria-hidden className="size-5" /></span>
              <span><span className="block text-sm font-semibold">บัตรเครดิต / เดบิต</span><span className="block text-xs text-muted">Visa · Mastercard · JCB</span></span>
            </li>
            {!order.subscription && (
              <li className="flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-4">
                <span className="grid size-10 place-items-center rounded-lg bg-panel-3"><QrCode aria-hidden className="size-5" /></span>
                <span><span className="block text-sm font-semibold">PromptPay</span><span className="block text-xs text-muted">สแกนจ่ายผ่านแอปธนาคาร</span></span>
              </li>
            )}
          </ul>
        </section>
      </div>

      {/* Right: order */}
      <aside className="lg:pl-12">
        <div className="rounded-2xl border border-line bg-panel-2 p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold tracking-tight">คำสั่งซื้อของคุณ</h2>
          <p className="mt-1 text-sm text-muted">{order.name}{order.until && ` · โปรถึง ${order.until}`}</p>

          <ul className="mt-5 space-y-3">
            {shown.length ? shown.map((code) => {
              const it = items[code];
              return (
                <li key={code} className="flex items-center gap-4 rounded-xl border border-line bg-panel p-3">
                  <span className="surface-dark relative size-16 shrink-0 overflow-hidden rounded-lg bg-ink">
                    {it?.image
                      // eslint-disable-next-line @next/next/no-img-element -- indicator poster
                      ? <img src={it.image} alt="" className="size-full object-cover object-top" />
                      : <span className="num grid size-full place-items-center text-sm font-bold text-white/60">{code}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{it?.name ?? code}</span>
                    <span className="block text-xs text-muted">{it?.family ? `${it.family} · ` : ""}{order.term}</span>
                  </span>
                  {code in parts && shown.length > 1 && <span className="shrink-0 text-sm text-muted tabular-nums">{fmtTHB(parts[code])}</span>}
                </li>
              );
            }) : (
              <li className="rounded-xl border border-dashed border-line-strong p-4 text-center text-sm text-muted">เลือกอินดิเคเตอร์ {pick?.count} ตัวทางซ้าย</li>
            )}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <Row k="อินดิเคเตอร์" v={`${pick ? pick.count : order.codes.length} ตัว`} />
            <Row k="ระยะเวลา" v={order.subscription ? `${order.term} (ตัดบัตรอัตโนมัติ)` : order.term} />
            {compare && <Row k="ราคาซื้อแยก" v={<span className="line-through">{fmtTHB(compare)}</span>} />}
            {compare && <Row k={`ส่วนลด${off ? ` ${off}%` : ""}`} v={<span className="font-semibold text-buy">-{fmtTHB(compare - order.amount)}</span>} />}
            <Row k="โค้ดส่วนลด" v="กรอกได้ในหน้า Stripe" />
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
            <span className="text-lg font-bold">ยอดชำระ</span>
            <span className="text-3xl font-extrabold tracking-tight tabular-nums">{fmtTHB(order.amount)}</span>
          </div>

          {state.error && !state.field && <p role="alert" className="mt-4 rounded-lg bg-sell/10 px-3 py-2 text-sm text-sell">{state.error}</p>}
          <button
            type="submit"
            disabled={pending || !ready}
            className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand text-base font-bold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
          >
            {pending ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <Lock aria-hidden className="size-4" />}
            {pending ? "กำลังไปหน้าชำระเงิน…" : !ready ? `เลือกอีก ${pick!.count - chosen.length} ตัว` : `ชำระ ${fmtTHB(order.amount)}`}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck aria-hidden className="size-3.5" /> ชำระอย่างปลอดภัยผ่าน Stripe</p>
        </div>
      </aside>
    </form>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return <div className="flex items-center justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>;
}

/** Input inside a bordered box with an icon and the label on top (like the reference). */
function BoxField({ icon, label, name, hint, hintTone, error, onBlur, ...input }: {
  icon: ReactNode; label: string; name: string; hint?: string; hintTone?: "good" | "bad"; error?: string; onBlur?: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onBlur" | "name">) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className={cx(
        "flex cursor-text items-start gap-3 rounded-xl border bg-panel px-4 py-3 transition-colors focus-within:border-fg focus-within:ring-[3px] focus-within:ring-ring/40",
        error ? "border-sell" : "border-line-strong",
      )}>
        <span className="mt-0.5 text-muted">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-muted">{label} <span aria-hidden className="text-sell">*</span></span>
          <input id={id} name={name} required aria-invalid={Boolean(error)} aria-describedby={`${id}-hint`}
            onBlur={onBlur ? (e) => onBlur(e.currentTarget.value) : undefined}
            className="num mt-0.5 w-full bg-transparent text-base text-fg outline-none placeholder:text-faint" {...input} />
        </span>
      </label>
      <p id={`${id}-hint`} className={cx("mt-1.5 px-1 text-sm", error || hintTone === "bad" ? "text-sell" : hintTone === "good" ? "text-buy" : "text-muted")}>{error ?? hint}</p>
    </div>
  );
}
