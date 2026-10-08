"use client";
import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Loader2, Sparkles } from "lucide-react";
import { buy, type BuyState } from "@/lib/store/actions";
import type { CatalogProduct } from "@/lib/store/catalog";
import { fmtTHB, termLabel } from "@/lib/store/pricing";

type Props = {
  product: CatalogProduct;
  indicator: { code: string; name: string; family: string; description: string; modes: string[]; image_url: string | null };
  /** Right the viewer already has: expiry (null = lifetime), undefined = none. */
  owned?: string | null;
  /** Best saving when bought as a pair, e.g. 46. */
  pairSaving?: number | null;
  /** Detail page base, e.g. "/indicators" (public) or "/store" (dashboard). */
  base?: string;
  /** Where checkout's "back" returns to. */
  from?: string;
};

/** "ซื้อรายตัว" (/pricing and /store): chart poster, what it does, price and one buy button. */
export function SingleCard({ product, indicator: ind, owned, pairSaving, base = "/indicators", from = "/pricing" }: Props) {
  const href = `${base}/${ind.code}`;
  const [state, action, pending] = useActionState<BuyState, FormData>(buy, {});
  const price = product.prices[0];
  const lifetime = owned === null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_20px_60px_-36px_rgb(0_0_0/0.45)] transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-brand/50">
      <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-ink" tabIndex={-1} aria-hidden>
        {ind.image_url
          // eslint-disable-next-line @next/next/no-img-element -- admin-provided poster
          ? <img src={ind.image_url} alt="" loading="lazy" className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]" />
          : <span className="grid size-full place-items-center text-5xl font-black text-white/15">{ind.code}</span>}
        <span className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{ind.family}</span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold tracking-tight">
            <Link href={href} className="hover:text-accent">{ind.name}</Link>
          </h3>
          <span className="num shrink-0 rounded-md bg-panel-3 px-2 py-0.5 text-xs font-semibold text-muted">{ind.code}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{ind.description}</p>
        {ind.modes.length > 0 && <p className="mt-2 text-xs font-medium text-muted">เข้าแบบ {ind.modes.join(" / ")}</p>}

        <div className="mt-auto pt-5">
          <p className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight tabular-nums">{fmtTHB(price.amount_satang)}</span>
            <span className="text-sm text-muted">· {termLabel(price)}</span>
          </p>
          {pairSaving ? (
            <Link href={`${href}#purchase`} className="mt-1.5 inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-buy hover:underline">
              <Sparkles aria-hidden className="size-4" /> จับคู่ประหยัดสูงสุด {pairSaving}%
            </Link>
          ) : <span className="mt-1.5 block min-h-8" />}

          {lifetime ? (
            <p className="mt-3 flex h-11 items-center justify-center gap-2 rounded-lg bg-buy-dim text-sm font-semibold text-buy">
              <BadgeCheck aria-hidden className="size-4" /> มีสิทธิ์ตลอดชีพแล้ว
            </p>
          ) : (
            <form action={action} className="mt-3 flex gap-2">
              <input type="hidden" name="price_id" value={price.id} />
              <input type="hidden" name="from" value={from} />
              <button type="submit" disabled={pending} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-strong disabled:opacity-60">
                {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
                {pending ? "กำลังไปหน้าชำระเงิน…" : owned ? "ต่ออายุ" : "ซื้อเลย"}
              </button>
              <Link href={href} aria-label={`รายละเอียด ${ind.name}`} className="grid h-11 w-11 place-items-center rounded-lg border border-line-strong text-muted hover:border-fg hover:text-fg">
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </form>
          )}
          {state.error && <p role="alert" className="mt-2 text-sm text-sell">{state.error}</p>}
        </div>
      </div>
    </article>
  );
}
