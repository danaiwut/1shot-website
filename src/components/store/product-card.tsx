"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Infinity as InfinityIcon, Loader2, Repeat } from "lucide-react";
import { Badge, cx, Notice } from "@/components/ui";
import { buy, type BuyState } from "@/lib/store/actions";
import type { CatalogProduct } from "@/lib/store/catalog";
import { fmtTHB, priceSuffix, termLabel } from "@/lib/store/pricing";

type Props = {
  product: CatalogProduct;
  /** code → expiry (null = lifetime) for codes the viewer can already use */
  access?: Record<string, string | null>;
  subscribed?: boolean;
  from: string;
  variant?: "bundle" | "single";
};

export function ProductCard({ product, access = {}, subscribed = false, from, variant = "bundle" }: Props) {
  const [state, action, pending] = useActionState<BuyState, FormData>(buy, {});
  const [priceId, setPriceId] = useState(product.prices[0]?.id);
  const price = product.prices.find((p) => p.id === priceId) ?? product.prices[0];
  const lifetimeAll = product.codes.every((c) => c in access && access[c] === null);
  const featured = product.featured && variant === "bundle";

  return (
    <article
      id={`product-${product.id}`}
      className={cx(
        "relative flex flex-col overflow-hidden rounded-3xl border p-5 sm:p-6",
        featured ? "surface-dark border-brand/40 bg-ink shadow-[0_30px_80px_-30px_rgb(178_0_22/0.7)]" : "border-line bg-panel shadow-[0_1px_2px_rgb(0_0_0/0.04)]",
      )}
    >
      {featured && <div className="brand-glow pointer-events-none absolute inset-0 opacity-60" />}
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wider text-accent uppercase">
              {product.kind === "bundle" ? `แพ็กเกจรวม · ${product.codes.length} อินดิเคเตอร์` : "รายตัว"}
            </p>
            <h3 className={cx("mt-1 font-bold tracking-tight", variant === "bundle" ? "text-xl sm:text-2xl" : "text-lg")}>{product.name}</h3>
          </div>
          {featured && <Badge tone="brand" className="bg-brand text-white">แนะนำ</Badge>}
        </div>
        {product.description && <p className="mt-2 text-sm leading-relaxed text-muted">{product.description}</p>}

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {product.codes.map((c) => (
            <li key={c} className={cx("num rounded-md border px-2 py-0.5 text-[11px] font-semibold", c in access ? "border-buy/30 bg-buy-dim text-buy" : "border-line bg-panel-2 text-muted")}>
              {c}{c in access && " ✓"}
            </li>
          ))}
        </ul>

        {product.features.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {product.features.map((f) => (
              <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.5} />{f}</li>
            ))}
          </ul>
        )}

        <form action={action} className="mt-auto pt-6">
          <input type="hidden" name="from" value={from} />
          <fieldset className="space-y-2">
            <legend className="sr-only">เลือกราคา</legend>
            {product.prices.map((p) => (
              <label
                key={p.id}
                className={cx(
                  "flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors",
                  p.id === price?.id ? "border-brand bg-brand-dim" : "border-line hover:border-line-strong",
                )}
              >
                <input type="radio" name="price_id" value={p.id} checked={p.id === price?.id} onChange={() => setPriceId(p.id)} className="sr-only" />
                <span className={cx("grid size-4 shrink-0 place-items-center rounded-full border-2", p.id === price?.id ? "border-brand" : "border-line-strong")}>
                  {p.id === price?.id && <span className="size-2 rounded-full bg-brand" />}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium whitespace-nowrap">
                  {p.billing === "subscription" ? <Repeat className="size-3.5 text-faint" /> : !p.duration_days ? <InfinityIcon className="size-3.5 text-faint" /> : null}
                  {termLabel(p)}
                </span>
                <span className="text-right whitespace-nowrap">
                  {p.compareSatang && <span className="num mr-1.5 text-[11px] text-faint line-through">{fmtTHB(p.compareSatang)}</span>}
                  <span className="num text-sm font-semibold">{fmtTHB(p.amount_satang)}</span>
                  <span className="text-[11px] text-muted">{p.billing === "subscription" ? priceSuffix(p) : ""}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {price?.compareSatang && (
            <p className="mt-2 text-xs font-medium text-buy">ประหยัด {fmtTHB(price.compareSatang - price.amount_satang)} เทียบกับซื้อแยกรายตัว</p>
          )}
          {state.error && <div className="mt-3"><Notice tone="error">{state.error}</Notice></div>}

          {lifetimeAll ? (
            <p className="mt-4 rounded-xl bg-buy-dim px-4 py-3 text-center text-sm font-medium text-buy">คุณมีสิทธิ์ตลอดชีพแล้ว</p>
          ) : subscribed && price?.billing === "subscription" ? (
            <Link href="/billing" className="mt-4 flex h-11 items-center justify-center rounded-xl border border-line-strong text-sm font-medium hover:border-fg">
              สมัครอยู่แล้ว · จัดการการชำระเงิน
            </Link>
          ) : (
            <button
              type="submit"
              disabled={pending || !price}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgb(178_0_22/0.6)] transition-colors hover:bg-brand-strong disabled:opacity-60"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "กำลังไปหน้าชำระเงิน…" : price?.billing === "subscription" ? `สมัคร${termLabel(price)} ${fmtTHB(price.amount_satang)}` : `ซื้อ ${price ? fmtTHB(price.amount_satang) : ""}`}
            </button>
          )}
          <p className="mt-2 text-center text-[11px] text-faint">
            {price?.billing === "subscription" ? "ตัดบัตรอัตโนมัติทุกงวด ยกเลิกได้ทุกเมื่อ" : "จ่ายครั้งเดียว บัตรเครดิต/เดบิต หรือ PromptPay"}
          </p>
        </form>
      </div>
    </article>
  );
}
