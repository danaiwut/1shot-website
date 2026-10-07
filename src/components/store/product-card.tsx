"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Infinity as InfinityIcon, Loader2, Repeat } from "lucide-react";
import { Badge, cx, Notice } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { buy, type BuyState } from "@/lib/store/actions";
import type { CatalogProduct } from "@/lib/store/catalog";
import { savingPercent } from "@/lib/store/offers";
import { fmtTHB, kindLabel, priceSuffix, termLabel } from "@/lib/store/pricing";
import { DealPicker, pickCompare } from "./deal-picker";
import { PairPicker } from "./pair-picker";
import type { PairOffer } from "@/lib/store/offers";

type Props = {
  product: CatalogProduct;
  /** code → expiry (null = lifetime) for codes the viewer can already use */
  access?: Record<string, string | null>;
  subscribed?: boolean;
  /** Viewer has bought before (undefined = not signed in). Gates "ลูกค้าเก่า" deals. */
  returning?: boolean;
  from: string;
  variant?: "bundle" | "single";
  /** Single products: pair deals that include this indicator ("จับคู่"). */
  pairs?: PairOffer[];
};

export function ProductCard({ product, access = {}, subscribed = false, returning, from, variant = "bundle", pairs = [] }: Props) {
  const [state, action, pending] = useActionState<BuyState, FormData>(buy, {});
  const [priceId, setPriceId] = useState(product.prices[0]?.id);
  const price = product.prices.find((p) => p.id === priceId) ?? product.prices[0];
  const pick = product.kind === "pick" ? product.pick_count ?? 1 : 0;
  const lifetime = product.codes.filter((c) => c in access && access[c] === null);
  const [chosen, setChosen] = useState<string[]>([]);
  const lifetimeAll = pick ? product.codes.length - lifetime.length < pick : lifetime.length === product.codes.length;
  const featured = product.featured && variant === "bundle";
  const locked = product.audience === "returning" && returning === false;
  const ready = !pick || chosen.length === pick;
  // Picks compare against the indicators actually chosen; before choosing, the cheapest possible choice.
  const compareOf = (p: CatalogProduct["prices"][number]) => (pick && ready ? pickCompare(p.parts, chosen, p.amount_satang) : p.compareSatang);
  const compare = price ? compareOf(price) : null;

  return (
    <article
      id={`product-${product.id}`}
      className={cx(
        "relative flex flex-col overflow-hidden rounded-2xl border p-5 sm:p-6",
        featured ? "surface-dark border-brand/40 bg-ink shadow-xl" : "border-line bg-panel shadow-[0_1px_2px_rgb(0_0_0/0.04)]",
      )}
    >
      {featured && <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-brand" />}
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wider text-accent uppercase">
              {kindLabel(product)}{product.audience === "returning" && " · ลูกค้าเก่า"}
            </p>
            <h3 className={cx("mt-1 font-bold tracking-tight", variant === "bundle" ? "text-xl sm:text-2xl" : "text-lg")}>
              {product.kind === "single" && product.codes.length === 1 && !from.startsWith("/indicators/")
                ? <Link href={`/indicators/${product.codes[0]}`} className="underline-offset-4 hover:underline">{product.name}</Link>
                : product.name}
            </h3>
          </div>
          {(product.badge || featured) && <Badge tone="brand" className="bg-brand text-white">{product.badge || "แนะนำ"}</Badge>}
        </div>
        {product.description && <p className="mt-2 text-sm leading-relaxed text-muted">{product.description}</p>}
        {product.available_until && <p className="mt-2 text-xs font-medium text-accent">โปรโมชั่นถึง {fmtDate(product.available_until)}</p>}

        {!pick && <ul className="mt-4 flex flex-wrap gap-1.5">
          {product.codes.map((c) => (
            <li key={c} className={cx("num rounded-md border px-2 py-0.5 text-xs font-semibold", c in access ? "border-buy/30 bg-buy-dim text-buy" : "border-line bg-panel-2 text-muted")}>
              {c}{c in access && <><span aria-hidden> ✓</span><span className="sr-only"> (มีสิทธิ์แล้ว)</span></>}
            </li>
          ))}
        </ul>}

        {product.features.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {product.features.map((f) => (
              <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.5} />{f}</li>
            ))}
          </ul>
        )}

        <form action={action} className="mt-auto pt-6">
          <input type="hidden" name="from" value={from} />
          {pick > 0 && (
            <div className="mb-4">
              <DealPicker
                pool={product.codes.map((code) => ({ code, name: product.names[code] ?? code }))}
                count={pick} chosen={chosen} onChange={setChosen} owned={lifetime} dark={featured}
              />
            </div>
          )}
          <fieldset className="space-y-2">
            <legend className="sr-only">เลือกราคา</legend>
            {product.prices.map((p) => (
              <label
                key={p.id}
                className={cx(
                  "flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border px-3.5 py-3 transition-colors",
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
                <span className="ml-auto text-right whitespace-nowrap">
                  {compareOf(p) && <span className="num mr-1.5 text-xs text-faint line-through">{fmtTHB(compareOf(p)!)}</span>}
                  <span className="num text-sm font-semibold">{fmtTHB(p.amount_satang)}</span>
                  <span className="text-xs text-muted">{p.billing === "subscription" ? priceSuffix(p) : ""}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {price && compare && (
            <p className="mt-2 text-xs font-medium text-buy">
              ประหยัด {fmtTHB(compare - price.amount_satang)} ({savingPercent(compare, price.amount_satang)}%) เทียบกับซื้อแยกรายตัว{pick > 0 && !ready && " (เริ่มต้น)"}
            </p>
          )}
          {state.error && <div className="mt-3"><Notice tone="error">{state.error}</Notice></div>}

          {locked ? (
            <p className="mt-4 rounded-xl border border-line px-4 py-3 text-center text-sm text-muted">ราคานี้สำหรับลูกค้าที่เคยซื้อแล้วเท่านั้น</p>
          ) : lifetimeAll ? (
            <p className="mt-4 rounded-xl bg-buy-dim px-4 py-3 text-center text-sm font-medium text-buy">คุณมีสิทธิ์ตลอดชีพแล้ว</p>
          ) : subscribed && price?.billing === "subscription" ? (
            <Link href="/billing" className="mt-4 flex h-11 items-center justify-center rounded-xl border border-line-strong text-sm font-medium hover:border-fg">
              สมัครอยู่แล้ว · จัดการการชำระเงิน
            </Link>
          ) : (
            <button
              type="submit"
              disabled={pending || !price || !ready}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgb(178_0_22/0.6)] transition-colors hover:bg-brand-strong disabled:opacity-60"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "กำลังไปหน้าชำระเงิน…" : !ready ? `เลือกอีก ${pick - chosen.length} ตัว` : price?.billing === "subscription" ? `สมัคร${termLabel(price)} ${fmtTHB(price.amount_satang)}` : `ซื้อ ${price ? fmtTHB(price.amount_satang) : ""}`}
            </button>
          )}
          <p className="mt-2 text-center text-xs text-faint">
            {price?.billing === "subscription" ? "ตัดบัตรอัตโนมัติทุกงวด ยกเลิกได้ทุกเมื่อ" : "จ่ายครั้งเดียว บัตรเครดิต/เดบิต หรือ PromptPay"}
          </p>
        </form>
        {product.kind === "single" && pairs.length > 0 && (
          <div className="mt-4"><PairPicker code={product.codes[0]} pairs={pairs} from={from} /></div>
        )}
      </div>
    </article>
  );
}
