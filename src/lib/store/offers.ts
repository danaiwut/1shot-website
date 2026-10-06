import type { CatalogProduct } from "./catalog";
import { fmtTHB, priceSuffix } from "./pricing";

/** How an indicator can be bought: its own single product, the bundles that include it, and the cheapest entry price. */
export function offerFor(products: CatalogProduct[], code: string) {
  const single = products.find((p) => p.kind === "single" && p.codes.length === 1 && p.codes[0] === code);
  const bundles = products.filter((p) => p.kind === "bundle" && p.codes.includes(code));
  const prices = [...(single?.prices ?? []), ...bundles.flatMap((b) => b.prices)];
  const from = prices.length ? prices.reduce((a, b) => (b.amount_satang < a.amount_satang ? b : a)) : null;
  return { single, bundles, from };
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
