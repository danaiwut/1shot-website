"use client";
import { useActionState, useState, useTransition, type ReactNode } from "react";
import { CandlestickChart, CheckCircle2, CreditCard, Hash, Loader2, Lock, Mail, QrCode, ShieldCheck, XCircle, Zap } from "lucide-react";
import { PickTile, SHADOW, Step } from "@/components/app/form-kit";
import { pickCompare } from "@/lib/store/pick";
import { cx } from "@/components/ui";
import { checkTradingViewName, startCheckout, type CheckoutState } from "@/lib/store/actions";
import { savingPercent } from "@/lib/store/offers";
import { fmtTHB } from "@/lib/store/pricing";

type Order = { name: string; term: string; subscription: boolean; amount: number; codes: string[]; until: string | null };
type Item = { name: string; image: string | null; family: string };
type Pick = { count: number; chosen: string[]; owned: string[] };

/** Apple-style checkout: numbered steps on the left, the order + one pay button in a sticky panel on the right (one form). */
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

  const full = pick ? chosen.length >= pick.count : false;
  const toggle = (code: string) => pick && setChosen(
    chosen.includes(code) ? chosen.filter((c) => c !== code) : pick.count === 1 ? [code] : full ? chosen : [...chosen, code],
  );
  let n = 0;
  const tvTone = tv ? (tv.ok ? "good" : tv.message.startsWith("ไม่พบ") ? "bad" : undefined) : undefined;

  return (
    <form action={action} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_26rem] xl:gap-8">
      <input type="hidden" name="price_id" value={priceId} />

      <div className="min-w-0 space-y-6">
        <Step n={++n} title="ยืนยันชื่อ TradingView" hint="ระบบจะเปิดสิทธิ์อินดิเคเตอร์ให้ชื่อนี้ใน TradingView อัตโนมัติหลังชำระเงินสำเร็จ">
          <BoxField
            icon={<CandlestickChart aria-hidden className="size-5" />} label="ชื่อผู้ใช้ TradingView" name="tradingview" defaultValue={tradingview}
            onBlur={check} autoComplete="off" spellCheck={false} placeholder="เช่น trader_one" large
            hint={checking ? "กำลังตรวจกับ TradingView…" : tv?.message ?? "พิมพ์แล้วกดออกจากช่อง ระบบจะตรวจชื่อให้ทันที"}
            hintTone={tvTone} hintIcon={checking ? <Loader2 aria-hidden className="size-4 animate-spin" /> : tvTone === "good" ? <CheckCircle2 aria-hidden className="size-4" /> : tvTone === "bad" ? <XCircle aria-hidden className="size-4" /> : null}
            error={err("tradingview")}
          />
        </Step>

        {pick && (
          <Step
            n={++n} title="เลือกอินดิเคเตอร์"
            hint={`ดีลนี้เลือกได้ ${pick.count} ตัว${pick.owned.length ? " ตัวที่มีสิทธิ์ตลอดชีพอยู่แล้วเลือกซ้ำไม่ได้" : ""}`}
            aside={<span aria-live="polite" className={cx("num rounded-full px-3 py-1 text-sm font-bold", full ? "bg-buy-dim text-buy" : "bg-panel-3 text-muted")}>เลือกแล้ว {chosen.length}/{pick.count}</span>}
          >
            <fieldset>
              <legend className="sr-only">เลือก {pick.count} ตัว</legend>
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {order.codes.map((code) => {
                  const on = chosen.includes(code);
                  const has = pick.owned.includes(code);
                  return (
                    <PickTile
                      key={code} type={pick.count === 1 ? "radio" : "checkbox"} name="codes" value={code} checked={on}
                      disabled={has || (!on && full && pick.count > 1)} onChange={() => toggle(code)}
                      title={items[code]?.name ?? code} code={code}
                      line={has ? "มีแล้วตลอดชีพ" : [items[code]?.family, code in parts ? `ปกติ ${fmtTHB(parts[code])}` : ""].filter(Boolean).join(" · ") || undefined}
                    />
                  );
                })}
              </div>
            </fieldset>
            {err("codes") && <p role="alert" className="mt-3 text-sm text-sell">{err("codes")}</p>}
          </Step>
        )}

        <Step n={++n} title="ข้อมูลติดต่อและบัญชีเทรด" hint="ใช้ส่งใบเสร็จ และผูกสิทธิ์กับบัญชี MT5 ของคุณ">
          <div className="grid gap-4 md:grid-cols-2">
            <BoxField icon={<Hash aria-hidden className="size-5" />} label="เลขบัญชีเทรด (MT5)" name="account" defaultValue={account} inputMode="numeric" hint="เช่น เลขบัญชี Exness ตัวเลข 4–20 หลัก" error={err("account")} />
            <BoxField icon={<Mail aria-hidden className="size-5" />} label="อีเมลรับใบเสร็จ" name="email" type="email" defaultValue={email} autoComplete="email" hint="ใบเสร็จจาก Stripe จะส่งไปที่อีเมลนี้" error={err("email")} />
          </div>
        </Step>

        <Step n={++n} title="วิธีชำระเงิน" hint="เลือกวิธีได้ในหน้าถัดไปของ Stripe ข้อมูลบัตรไม่ผ่านเว็บเรา">
          <ul className="grid gap-3 sm:grid-cols-2">
            <PayTile icon={CreditCard} title="บัตรเครดิต / เดบิต" line="Visa · Mastercard · JCB" />
            {!order.subscription && <PayTile icon={QrCode} title="PromptPay" line="สแกนจ่ายผ่านแอปธนาคาร" />}
          </ul>
          {order.subscription && <p className="mt-3 text-sm text-muted">แพ็กเกจรายงวดชำระด้วยบัตรเท่านั้น ระบบจะตัดบัตรอัตโนมัติทุกงวด ยกเลิกได้ทุกเมื่อ</p>}
        </Step>
      </div>

      {/* Order summary */}
      <aside aria-labelledby="order-title" className="xl:sticky xl:top-24">
        <div className={cx("rounded-3xl border border-line bg-panel p-5 sm:p-6", SHADOW)}>
          <p className="text-sm font-bold text-accent">สรุปคำสั่งซื้อ</p>
          <h2 id="order-title" className="mt-2 text-2xl font-black tracking-tight">{order.name}<span className="text-brand">.</span></h2>
          <p className="mt-1 text-sm text-muted">{order.term}{order.until && ` · โปรถึง ${order.until}`}</p>

          <ul className="mt-5 space-y-2.5">
            {shown.length ? shown.map((code) => {
              const it = items[code];
              return (
                <li key={code} className="flex items-center gap-3 rounded-2xl bg-panel-2 p-2.5">
                  <span className="surface-dark relative size-14 shrink-0 overflow-hidden rounded-xl bg-ink">
                    {it?.image
                      // eslint-disable-next-line @next/next/no-img-element -- indicator poster
                      ? <img src={it.image} alt="" className="size-full object-cover object-top" />
                      : <span className="num grid size-full place-items-center text-sm font-bold text-white/60">{code}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{it?.name ?? code}</span>
                    <span className="block truncate text-xs text-muted">{it?.family ? `${it.family} · ` : ""}{order.term}</span>
                  </span>
                  {code in parts && shown.length > 1 && <span className="num shrink-0 pr-1 text-sm text-muted tabular-nums">{fmtTHB(parts[code])}</span>}
                </li>
              );
            }) : (
              <li className="rounded-2xl border border-dashed border-line-strong p-5 text-center text-sm text-muted">เลือกอินดิเคเตอร์ {pick?.count} ตัวในขั้นตอนที่ 2</li>
            )}
          </ul>

          <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
            <Row k="อินดิเคเตอร์" v={`${pick ? pick.count : order.codes.length} ตัว`} />
            <Row k="ระยะเวลา" v={order.subscription ? `${order.term} (ตัดบัตรอัตโนมัติ)` : order.term} />
            {compare && <Row k="ราคาซื้อแยก" v={<span className="num text-muted line-through tabular-nums">{fmtTHB(compare)}</span>} />}
            {compare && <Row k={`ประหยัด${off ? ` ${off}%` : ""}`} v={<span className="num font-bold text-buy tabular-nums">-{fmtTHB(compare - order.amount)}</span>} />}
            <Row k="โค้ดส่วนลด" v="กรอกได้ในหน้า Stripe" />
          </dl>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-t border-line pt-5">
            <span className="text-base font-bold">ยอดชำระ</span>
            <span className="num text-4xl font-black tracking-tight tabular-nums">{fmtTHB(order.amount)}</span>
          </div>

          {state.error && !state.field && <p role="alert" className="mt-4 rounded-xl bg-sell-dim px-3 py-2 text-sm text-sell">{state.error}</p>}
          {state.error && state.field && <p className="mt-4 rounded-xl bg-sell-dim px-3 py-2 text-sm text-sell xl:hidden">{state.error}</p>}
          <button
            type="submit" disabled={pending || !ready}
            className="mt-5 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-bold text-white shadow-[0_16px_40px_-16px_rgb(178_0_22/0.8)] transition-colors hover:bg-brand-strong disabled:opacity-60"
          >
            {pending ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <Lock aria-hidden className="size-4" />}
            {pending ? "กำลังไปหน้าชำระเงิน…" : !ready ? `เลือกอีก ${pick!.count - chosen.length} ตัว` : `ชำระ ${fmtTHB(order.amount)}`}
          </button>
          <ul className="mt-4 grid gap-2 text-xs text-muted">
            <li className="flex items-center gap-2"><ShieldCheck aria-hidden className="size-4 shrink-0 text-accent" />ชำระอย่างปลอดภัยผ่าน Stripe ข้อมูลบัตรไม่ผ่านเว็บเรา</li>
            <li className="flex items-center gap-2"><Zap aria-hidden className="size-4 shrink-0 text-accent" />เปิดสิทธิ์ใน TradingView อัตโนมัติหลังชำระเงิน</li>
          </ul>
        </div>
      </aside>
    </form>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return <div className="flex items-center justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>;
}

function PayTile({ icon: Icon, title, line }: { icon: typeof CreditCard; title: string; line: string }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border-2 border-line p-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-dim text-accent"><Icon aria-hidden className="size-5" /></span>
      <span className="min-w-0"><span className="block font-bold">{title}</span><span className="block text-xs text-muted">{line}</span></span>
    </li>
  );
}

/** Input inside a bordered box with an icon and the label on top. */
function BoxField({ icon, label, name, hint, hintTone, hintIcon, error, onBlur, large, ...input }: {
  icon: ReactNode; label: string; name: string; hint?: string; hintTone?: "good" | "bad"; hintIcon?: ReactNode; error?: string;
  onBlur?: (v: string) => void; large?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onBlur" | "name">) {
  const id = `f-${name}`;
  const bad = Boolean(error) || hintTone === "bad";
  return (
    <div>
      <label htmlFor={id} className={cx(
        "flex cursor-text items-start gap-3 rounded-xl border bg-panel px-4 transition-colors focus-within:border-fg focus-within:ring-[3px] focus-within:ring-ring/40",
        large ? "py-4" : "py-3",
        bad ? "border-sell" : hintTone === "good" ? "border-buy" : "border-line-strong",
      )}>
        <span className="mt-0.5 text-muted">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-muted">{label} <span aria-hidden className="text-sell">*</span></span>
          <input id={id} name={name} required aria-invalid={Boolean(error)} aria-describedby={`${id}-hint`}
            onBlur={onBlur ? (e) => onBlur(e.currentTarget.value) : undefined}
            className={cx("num mt-0.5 w-full bg-transparent text-fg outline-none placeholder:text-faint", large ? "text-lg font-semibold" : "text-base")} {...input} />
        </span>
      </label>
      <p id={`${id}-hint`} aria-live="polite" className={cx("mt-1.5 flex items-center gap-1.5 px-1 text-sm", bad ? "text-sell" : hintTone === "good" ? "text-buy" : "text-muted")}>
        {!error && hintIcon}{error ?? hint}
      </p>
    </div>
  );
}
