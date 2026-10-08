"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2 } from "lucide-react";
import { cx } from "@/components/ui";
import { buy, type BuyState } from "@/lib/store/actions";
import type { CatalogProduct } from "@/lib/store/catalog";
import { savingPercent } from "@/lib/store/offers";
import { fmtTHB, termLabel } from "@/lib/store/pricing";
import type { Promotion } from "@/lib/types";

const thaiDate = (iso: string) => new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
const num = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });

type Ownership = {
  /** code → expiry (null = lifetime) for codes the viewer can already use */
  access?: Record<string, string | null>;
  /** Product ids the viewer has a live subscription to. */
  subscribed?: string[];
  /** Viewer has bought before (undefined = not signed in). Gates "ลูกค้าเก่า" deals. */
  returning?: boolean;
};

/**
 * "แพ็กเกจและโปรโมชั่น" (homepage, /pricing, /store): the running promotion as the heading, then a classic
 * pricing table (featured deal in the middle, raised and in brand red). `max` caps the cards (homepage: 3).
 */
export function PricingTable({ products, promotion, from = "/", max = 3, heading = true, ...own }: {
  products: CatalogProduct[]; promotion: Promotion | null; from?: string; max?: number; heading?: boolean;
} & Ownership) {
  // Featured deal in the middle.
  const ranked = [...products].sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort - b.sort).slice(0, max);
  const [hero, ...rest] = ranked;
  const cards = rest.length === 2 ? [rest[0], hero, rest[1]] : ranked;
  if (!hero) return null;

  return (
    <div className="relative">
      {heading && <Heading promotion={promotion} />}
      <ul className={cx("mx-auto grid items-stretch gap-5", heading && "mt-12 sm:mt-14", cards.length >= 3 ? "max-w-5xl lg:grid-cols-3 lg:gap-x-0 lg:gap-y-12" : cards.length === 2 ? "max-w-3xl md:grid-cols-2" : "max-w-sm")}>
        {cards.map((p) => <DealCard key={p.id} product={p} featured={p.id === hero.id && cards.length > 1} from={from} {...own} />)}
      </ul>
    </div>
  );
}

function Heading({ promotion: promo }: { promotion: Promotion | null }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mx-auto max-w-2xl text-center">
      {promo?.badge && <p className="inline-flex rounded-full bg-brand-dim px-3 py-1 text-sm font-semibold text-accent">{promo.badge}</p>}
      <h2 id="pricing-title" className="mt-4 text-3xl leading-tight font-bold tracking-tight sm:text-5xl">
        {promo?.title ?? "แพ็กเกจและโปรโมชั่น"}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-muted">
        {promo?.body || "ซื้อเป็นคู่หรือเป็นแพ็กเกจ คุ้มกว่าซื้อแยกรายตัว"}
      </p>
      {promo && (
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
          <span className="text-muted">โปรโมชั่นถึง {thaiDate(`${promo.ends_on}T00:00:00+07:00`)}</span>
          {promo.code && (
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(promo.code!).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-dashed border-line-strong px-3 font-semibold hover:border-fg"
              aria-label={`คัดลอกโค้ด ${promo.code}`}
            >
              โค้ด <span className="num tracking-wider">{promo.code}</span>
              {copied ? <Check aria-hidden className="size-4 text-buy" /> : <Copy aria-hidden className="size-4 text-muted" />}
            </button>
          )}
          <span aria-live="polite" className="sr-only">{copied ? "คัดลอกโค้ดแล้ว" : ""}</span>
        </p>
      )}
    </div>
  );
}

/** One deal / bundle, landing style. Picks choose their indicators at checkout. */
export function DealCard({ product: p, featured, from, access = {}, subscribed = [], returning }: { product: CatalogProduct; featured: boolean; from: string } & Ownership) {
  const [state, action, pending] = useActionState<BuyState, FormData>(buy, {});
  const [priceId, setPriceId] = useState(p.prices[0]?.id);
  const price = p.prices.find((x) => x.id === priceId) ?? p.prices[0];
  const off = savingPercent(price.compareSatang, price.amount_satang);
  const names = p.codes.map((c) => p.names[c] ?? c);
  const term = termLabel(price);
  const pay = price.billing === "subscription" ? "ตัดบัตรอัตโนมัติ ยกเลิกได้" : "จ่ายครั้งเดียว";
  const pick = p.kind === "pick" ? p.pick_count ?? 1 : 0;
  const lifetime = p.codes.filter((c) => c in access && access[c] === null);
  const ownedAll = pick ? p.codes.length - lifetime.length < pick : lifetime.length === p.codes.length;
  const locked = p.audience === "returning" && returning === false;
  const isSub = subscribed.includes(p.id) && price.billing === "subscription";
  const rows: { key: string; main: string; sub?: string }[] = [
    p.kind === "pick"
      ? { key: "codes", main: `เลือกเอง ${p.pick_count} ตัว จาก ${names.length} ตัว`, sub: names.join(" · ") }
      : { key: "codes", main: names.map((n, i) => (p.codes[i] in access ? `${n} ✓` : n)).join(" + ") },
    ...p.features.map((f) => ({ key: f, main: f })),
    // Don't repeat "ตลอดชีพ" when a feature already says it.
    { key: "terms", main: p.features.some((f) => f.includes(term)) ? pay : `${term} · ${pay}` },
  ];
  const note = cx("mt-6 flex h-12 w-full items-center justify-center rounded-lg px-3 text-sm font-semibold", featured ? "bg-white/15 text-white" : "bg-panel-3 text-muted");

  return (
    <li
      className={cx(
        "relative flex flex-col rounded-2xl px-6 py-8 text-center sm:px-8",
        featured
          ? "z-10 max-lg:order-first bg-gradient-to-b from-brand to-brand-strong text-white shadow-[0_30px_80px_-24px_rgb(178_0_22/0.55)] lg:-my-6 lg:py-12"
          : "border border-line bg-panel shadow-[0_20px_60px_-30px_rgb(0_0_0/0.35)]",
      )}
    >
      {p.badge && (
        <span className={cx("absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap", featured ? "bg-white text-brand" : "bg-brand text-white")}>
          {p.badge}
        </span>
      )}
      <h3 className={cx("text-base font-semibold", featured ? "text-white" : "text-fg")}>{p.name}</h3>
      {p.audience === "returning" && <p className={cx("mt-1 text-xs", featured ? "text-white/85" : "text-muted")}>สำหรับลูกค้าที่เคยซื้อแล้ว</p>}

      <p className="mt-5 flex items-start justify-center gap-1">
        <span className="mt-2 text-2xl font-bold">฿</span>
        <span className="text-5xl leading-none font-extrabold tracking-tight tabular-nums sm:text-6xl">{num.format(price.amount_satang / 100)}</span>
      </p>
      <p className={cx("mt-2 min-h-5 text-sm", featured ? "text-white/85" : "text-muted")}>
        {price.compareSatang
          ? <>ปกติ <span className="line-through tabular-nums">{fmtTHB(price.compareSatang)}</span>{off && <span className={cx("ml-1.5 font-semibold", featured ? "text-white" : "text-buy")}>ประหยัด {off}%</span>}</>
          : " "}
      </p>

      {p.prices.length > 1 && (
        <fieldset className={cx("mx-auto mt-4 inline-flex rounded-full border p-1", featured ? "border-white/30" : "border-line")}>
          <legend className="sr-only">เลือกระยะเวลา</legend>
          {p.prices.map((x) => (
            <label key={x.id} className={cx(
              "cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
              x.id === price.id ? (featured ? "bg-white text-brand" : "bg-brand text-white") : featured ? "text-white/85 hover:text-white" : "text-muted hover:text-fg",
            )}>
              <input type="radio" name={`term-${p.id}`} checked={x.id === price.id} onChange={() => setPriceId(x.id)} className="sr-only" />
              {termLabel(x)}
            </label>
          ))}
        </fieldset>
      )}

      <ul className={cx("mt-6 flex-1 divide-y border-y text-sm", featured ? "divide-white/25 border-white/25" : "divide-line border-line")}>
        {rows.map((r) => (
          <li key={r.key} className="px-1 py-3.5 font-medium">
            {r.main}
            {r.sub && <span className={cx("mt-1 block text-xs font-normal", featured ? "text-white/85" : "text-muted")}>{r.sub}</span>}
          </li>
        ))}
      </ul>
      {p.available_until && <p className={cx("mt-4 text-xs", featured ? "text-white/85" : "text-muted")}>ถึง {thaiDate(p.available_until)}</p>}

      {locked ? (
        <p className={note}>สำหรับลูกค้าที่เคยซื้อแล้วเท่านั้น</p>
      ) : ownedAll ? (
        <p className={note}>คุณมีสิทธิ์ตลอดชีพแล้ว</p>
      ) : isSub ? (
        <Link href="/store#history" className={cx(note, "hover:underline")}>สมัครอยู่แล้ว · ดูประวัติ</Link>
      ) : (
        <form action={action} className="mt-6">
          <input type="hidden" name="price_id" value={price.id} />
          <input type="hidden" name="from" value={from} />
          <button
            type="submit"
            disabled={pending}
            className={cx(
              "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 text-sm font-bold tracking-wide transition-colors disabled:opacity-60",
              featured ? "border-white bg-white text-brand hover:bg-white/90" : "border-brand text-accent hover:bg-brand hover:text-white",
            )}
          >
            {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
            {pending ? "กำลังไปหน้าชำระเงิน…" : pick ? "เลือกอินดิเคเตอร์" : price.billing === "subscription" ? `สมัคร${term}` : "เลือกแพ็กเกจนี้"}
          </button>
        </form>
      )}
      {state.error && <p role="alert" className={cx("mt-2 text-sm", featured ? "text-white" : "text-sell")}>{state.error}</p>}
    </li>
  );
}
