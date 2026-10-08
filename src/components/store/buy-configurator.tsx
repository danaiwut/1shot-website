"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Check, Loader2, Lock } from "lucide-react";
import { cx } from "@/components/ui";
import { buy, type BuyState } from "@/lib/store/actions";
import { fmtTHB } from "@/lib/store/pricing";

export type SingleOption = { priceId: string; label: string; note?: string; amount: number; compare: number | null; codes?: string[] };
export type PairOption = { partner: string; partnerName: string; priceId: string; amount: number; compare: number | null; pick: boolean; note?: string };

type Props = {
  code: string;
  name: string;
  singles: SingleOption[];
  pairs: PairOption[];
  perks: string[];
  /** Viewer's current right on this indicator: expiry, null = lifetime, undefined = none. */
  owned?: string | null;
  signedIn: boolean;
  /** Where checkout's "back" returns to. */
  from?: string;
};

const pct = (compare: number | null, amount: number) => (compare && compare > amount ? Math.floor(((compare - amount) / compare) * 100) : null);

/** Apple-store style: choose how to buy (one / pair), then the option, then a sticky summary with one button. */
export function BuyConfigurator({ code, name, singles, pairs, perks, owned, signedIn, from = `/indicators/${code}` }: Props) {
  const [mode, setMode] = useState<"single" | "pair">(singles.length ? "single" : "pair");
  const [singleId, setSingleId] = useState(singles[0]?.priceId);
  const [partner, setPartner] = useState(pairs[0]?.partner);
  const [state, action, pending] = useActionState<BuyState, FormData>(buy, {});

  if (owned === null) {
    return (
      <div className="rounded-2xl border border-buy/30 bg-buy-dim p-5">
        <p className="flex items-center gap-2 font-semibold text-buy"><BadgeCheck aria-hidden className="size-5" /> คุณมีสิทธิ์ {name} ตลอดชีพแล้ว</p>
        <p className="mt-1 text-sm text-muted">ดูสัญญาณและห้อง Telegram ได้ที่แดชบอร์ด</p>
        <Link href="/signals" className="mt-4 inline-flex h-11 items-center rounded-full bg-fg px-5 text-sm font-semibold text-ink">ไปที่สัญญาณ</Link>
      </div>
    );
  }
  if (!singles.length && !pairs.length) {
    return <p className="rounded-2xl border border-line bg-panel p-5 text-sm text-muted">ยังไม่เปิดขาย ติดตามโปรโมชั่นได้ที่หน้าแพ็กเกจและราคา</p>;
  }

  const single = singles.find((s) => s.priceId === singleId) ?? singles[0];
  const pair = pairs.find((p) => p.partner === partner) ?? pairs[0];
  const chosen = mode === "single" ? single : pair;
  const summary = mode === "single" ? `${name} · ${single?.label}` : `${name} + ${pair?.partnerName} · ตลอดชีพ`;
  const bestPair = Math.max(0, ...pairs.map((p) => pct(p.compare, p.amount) ?? 0));

  return (
    <form action={action} className="space-y-9">
      <input type="hidden" name="from" value={from} />
      {chosen && <input type="hidden" name="price_id" value={chosen.priceId} />}
      {mode === "single" && single?.codes?.map((c) => <input key={c} type="hidden" name="codes" value={c} />)}
      {mode === "pair" && pair?.pick && <><input type="hidden" name="codes" value={code} /><input type="hidden" name="codes" value={pair.partner} /></>}

      {/* 1 · how */}
      <Step n={1} title="รูปแบบ" hint="ซื้อตัวเดียว หรือจับคู่ให้คุ้มกว่า">
        <div className="grid gap-3">
          {singles.length > 0 && (
            <Tile on={mode === "single"} onSelect={() => setMode("single")} name="mode" value="single"
              title={`${name} ตัวเดียว`} sub="ใช้ได้ตลอดชีพ"
              right={<>เริ่มต้น <b className="text-fg">{fmtTHB(Math.min(...singles.map((s) => s.amount)))}</b></>} />
          )}
          {pairs.length > 0 && (
            <Tile on={mode === "pair"} onSelect={() => setMode("pair")} name="mode" value="pair"
              title={`${name} + อีก 1 ตัว`} sub={bestPair ? `ประหยัดสูงสุด ${bestPair}%` : "ราคาพิเศษเมื่อซื้อคู่"} subTone="buy"
              right={<>เริ่มต้น <b className="text-fg">{fmtTHB(Math.min(...pairs.map((p) => p.amount)))}</b></>} />
          )}
        </div>
      </Step>

      {/* 2 · which */}
      {mode === "single" ? (
        <Step n={2} title="แพ็กเกจ" hint="ราคาสำหรับ 1 บัญชี TradingView">
          <div className="grid gap-3">
            {singles.map((s) => (
              <Tile key={s.priceId} on={s.priceId === single?.priceId} onSelect={() => setSingleId(s.priceId)} name="single" value={s.priceId}
                title={s.label} sub={s.note} subTone={s.note ? "accent" : undefined}
                right={<Price amount={s.amount} compare={s.compare} />} />
            ))}
          </div>
        </Step>
      ) : (
        <Step n={2} title="จับคู่กับ" hint="ราคาขีดฆ่าคือซื้อแยก 2 ตัว">
          <div className="grid gap-3 sm:grid-cols-2">
            {pairs.map((p) => (
              <Tile key={p.partner} on={p.partner === pair?.partner} onSelect={() => setPartner(p.partner)} name="partner" value={p.partner}
                title={p.partnerName} sub={p.note ?? (pct(p.compare, p.amount) ? `ประหยัด ${pct(p.compare, p.amount)}%` : undefined)} subTone="buy"
                right={<Price amount={p.amount} compare={p.compare} />} stacked />
            ))}
          </div>
        </Step>
      )}

      {/* 3 · what you get */}
      {perks.length > 0 && (
        <Step n={3} title="สิ่งที่ได้รับ">
          <ul className="grid gap-2.5 rounded-2xl border border-line bg-panel p-5 sm:grid-cols-2">
            {perks.map((p) => <li key={p} className="flex items-start gap-2.5 text-sm"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.5} />{p}</li>)}
          </ul>
        </Step>
      )}

      {/* Summary */}
      <div className="sticky bottom-3 z-20 rounded-2xl border border-line bg-panel/95 p-4 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.45)] backdrop-blur-xl sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted">{summary}</p>
            <p className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight tabular-nums">{chosen ? fmtTHB(chosen.amount) : "—"}</span>
              {chosen?.compare && chosen.compare > chosen.amount && <span className="text-sm text-muted line-through tabular-nums">{fmtTHB(chosen.compare)}</span>}
            </p>
          </div>
          <button type="submit" disabled={pending || !chosen} className="inline-flex h-12 min-w-40 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-7 text-base font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60 sm:flex-none">
            {pending ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <Lock aria-hidden className="size-4" />}
            {pending ? "กำลังไปชำระเงิน…" : owned ? "ต่ออายุ" : "ซื้อ"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">{signedIn ? "ขั้นถัดไป: ยืนยันชื่อ TradingView แล้วชำระผ่าน Stripe" : "ต้องเข้าสู่ระบบก่อน แล้วระบบพาไปหน้าชำระเงินต่อ"}</p>
        {state.error && <p role="alert" className="mt-2 text-sm text-sell">{state.error}</p>}
      </div>
    </form>
  );
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-4">
        <span className="text-xl font-bold tracking-tight"><span className="text-muted">{n}.</span> {title}</span>
        {hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function Tile({ on, onSelect, name, value, title, sub, subTone, right, stacked = false }: {
  on: boolean; onSelect: () => void; name: string; value: string; title: string; sub?: string; subTone?: "buy" | "accent"; right: React.ReactNode; stacked?: boolean;
}) {
  return (
    <label className={cx(
      "flex min-h-18 cursor-pointer gap-3 rounded-2xl border-2 bg-panel px-5 py-4 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
      stacked ? "flex-col" : "items-center justify-between",
      on ? "border-brand" : "border-line hover:border-line-strong",
    )}>
      <input type="radio" name={name} value={value} checked={on} onChange={onSelect} className="sr-only" />
      <span className="min-w-0">
        <span className="block text-base font-semibold">{title}</span>
        {sub && <span className={cx("mt-0.5 block text-sm", subTone === "buy" ? "text-buy" : subTone === "accent" ? "text-accent" : "text-muted")}>{sub}</span>}
      </span>
      <span className={cx("shrink-0 text-sm text-muted", stacked ? "" : "text-right")}>{right}</span>
    </label>
  );
}

function Price({ amount, compare }: { amount: number; compare: number | null }) {
  return (
    <span className="tabular-nums">
      {compare && compare > amount && <span className="mr-1.5 line-through">{fmtTHB(compare)}</span>}
      <b className="text-base text-fg">{fmtTHB(amount)}</b>
    </span>
  );
}
