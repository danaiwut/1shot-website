"use client";
import { useActionState, useId, useState } from "react";
import { ChevronDown, Loader2, Plus } from "lucide-react";
import { cx, Notice } from "@/components/ui";
import { buy, type BuyState } from "@/lib/store/actions";
import { savingPercent, type PairOffer } from "@/lib/store/offers";
import { fmtTHB, priceSuffix } from "@/lib/store/pricing";

type Props = {
  code: string;
  pairs: PairOffer[];
  from: string;
  /** Start expanded (indicator page) instead of behind the "จับคู่" button (store cards). */
  open?: boolean;
};

/** "จับคู่": add a second indicator and pay the pair price instead of two single prices. */
export function PairPicker({ code, pairs, from, open: startOpen = false }: Props) {
  const [open, setOpen] = useState(startOpen);
  const [partner, setPartner] = useState(pairs[0]?.partner);
  const [state, action, pending] = useActionState<BuyState, FormData>(buy, {});
  const panel = useId();
  if (!pairs.length) return null;

  const pair = pairs.find((p) => p.partner === partner) ?? pairs[0];
  const best = Math.max(...pairs.map((p) => savingPercent(p.compareSatang, p.price.amount_satang) ?? 0));
  const nameOf = (c: string) => pair.product.names[c] ?? c;
  const off = savingPercent(pair.compareSatang, pair.price.amount_satang);

  return (
    <div className="rounded-2xl border border-dashed border-brand/50 bg-brand-dim/40">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-white"><Plus className="size-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">จับคู่กับอินดิเคเตอร์อื่น</span>
          <span className="block text-xs text-muted">{best > 0 ? `ซื้อคู่ ประหยัดสูงสุด ${best}%` : "ซื้อเป็นคู่ในราคาพิเศษ"}</span>
        </span>
        <ChevronDown aria-hidden className={cx("size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <form id={panel} action={action} className="space-y-3 border-t border-dashed border-brand/40 px-4 pt-3 pb-4">
          <input type="hidden" name="from" value={from} />
          <input type="hidden" name="price_id" value={pair.price.id} />
          {pair.product.kind === "pick" && <><input type="hidden" name="codes" value={code} /><input type="hidden" name="codes" value={pair.partner} /></>}

          <fieldset>
            <legend className="mb-2 text-xs font-medium text-muted">{nameOf(code)} คู่กับ</legend>
            <div className="flex flex-wrap gap-2">
              {pairs.map((p) => {
                const on = p.partner === pair.partner;
                return (
                  <label key={p.partner} className={cx(
                    "inline-flex min-h-11 cursor-pointer items-center rounded-lg border px-3 text-sm font-semibold transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                    on ? "border-brand bg-brand text-white" : "border-line bg-panel hover:border-line-strong",
                  )}>
                    <input type="radio" name="partner" value={p.partner} checked={on} onChange={() => setPartner(p.partner)} className="sr-only" />
                    {p.product.names[p.partner] ?? p.partner}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="rounded-xl bg-panel px-3.5 py-3">
            <p className="text-sm font-medium">{nameOf(code)} + {nameOf(pair.partner)}</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              {pair.compareSatang && <span className="num text-sm text-faint line-through">{fmtTHB(pair.compareSatang)}</span>}
              <span className="num text-xl font-semibold">{fmtTHB(pair.price.amount_satang)}</span>
              <span className="text-xs text-muted">{priceSuffix(pair.price)}</span>
            </p>
            {off && pair.compareSatang && <p className="mt-1 text-xs font-medium text-buy">ประหยัด {fmtTHB(pair.compareSatang - pair.price.amount_satang)} ({off}%) เทียบกับซื้อแยก</p>}
            {pair.product.audience === "returning" && <p className="mt-1 text-xs text-muted">ราคาสำหรับลูกค้าเก่า</p>}
          </div>

          {state.error && <Notice tone="error">{state.error}</Notice>}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "กำลังไปหน้าชำระเงิน…" : `ซื้อคู่นี้ ${fmtTHB(pair.price.amount_satang)}`}
          </button>
        </form>
      )}
    </div>
  );
}
