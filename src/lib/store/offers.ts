import type { CatalogPrice, CatalogProduct } from "./catalog";
import { fmtTHB, priceSuffix } from "./pricing";

/** How an indicator can be bought: its own single product, the bundles that include it, and the cheapest entry price. */
export function offerFor(products: CatalogProduct[], code: string) {
  const single = products.find((p) => p.kind === "single" && p.codes.length === 1 && p.codes[0] === code);
  const bundles = products.filter((p) => p.kind === "bundle" && p.codes.includes(code));
  const prices = [...(single?.prices ?? []), ...bundles.flatMap((b) => b.prices)];
  const from = prices.length ? prices.reduce((a, b) => (b.amount_satang < a.amount_satang ? b : a)) : null;
  return { single, bundles, from };
}

export type PairOffer = {
  /** The other indicator in the pair. */
  partner: string;
  product: CatalogProduct;
  price: CatalogPrice;
  /** Both codes bought one by one with the same terms, when both are sold singly. */
  compareSatang: number | null;
};

/**
 * "จับคู่": for each other indicator, the cheapest way to get it together with `code` — a 2-code bundle
 * of exactly those two, or a "pick 2" deal whose pool has both. Deals limited to returning customers are
 * only offered when `returning` is true.
 */
export function pairOffers(products: CatalogProduct[], code: string, returning = false): PairOffer[] {
  const best = new Map<string, PairOffer>();
  for (const product of products) {
    if (!product.codes.includes(code)) continue;
    if (product.audience === "returning" && !returning) continue;
    const partners =
      product.kind === "bundle" && product.codes.length === 2 ? product.codes.filter((c) => c !== code)
      : product.kind === "pick" && product.pick_count === 2 ? product.codes.filter((c) => c !== code)
      : [];
    for (const partner of partners) {
      for (const price of product.prices) {
        const a = price.parts[code], b = price.parts[partner];
        const compare = a && b && a + b > price.amount_satang ? a + b : null;
        const cur = best.get(partner);
        if (!cur || price.amount_satang < cur.price.amount_satang) best.set(partner, { partner, product, price, compareSatang: compare });
      }
    }
  }
  return [...best.values()].sort((x, y) => x.price.amount_satang - y.price.amount_satang);
}

/** "ประหยัด 39%" — whole percent saved, or null when there is no real saving. */
export function savingPercent(compare: number | null, amount: number) {
  if (!compare || compare <= amount) return null;
  return Math.floor(((compare - amount) / compare) * 100);
}

/** Card summary for each indicator: cheapest price, rating, and whether the viewer already has it. */
export function indicatorOffers(
  indicators: { code: string; is_reference: boolean }[],
  products: CatalogProduct[],
  ratings: Record<string, { avg: number; count: number }>,
  access?: Record<string, string | null>,
) {
  return indicators.map((i) => {
    const { from } = offerFor(products, i.code);
    const free = i.is_reference;
    return {
      code: i.code,
      rating: ratings[i.code],
      price: free ? "ฟรีสำหรับสมาชิก" : from ? fmtTHB(from.amount_satang) : "ยังไม่เปิดขาย",
      suffix: from && !free ? priceSuffix(from) : undefined,
      owned: Boolean(access && i.code in access),
    };
  });
}
