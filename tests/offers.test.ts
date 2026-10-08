import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/lib/store/catalog";
import { offerFor } from "@/lib/store/offers";

const price = (amount: number) => ({ id: `p${amount}`, amount_satang: amount, billing: "subscription", interval: "month", duration_days: null, active: true, sort: 0, compareSatang: null });
const product = (kind: "single" | "bundle", codes: string[], amount: number) =>
  ({ id: `${kind}-${codes.join("")}`, kind, codes, name: codes.join("+"), prices: [price(amount)] }) as unknown as CatalogProduct;

describe("offerFor", () => {
  const products = [product("single", ["OB"], 99000), product("bundle", ["OB", "SW"], 149000)];

  it("finds the single product and the bundles that include the code", () => {
    const { single, bundles } = offerFor(products, "OB");
    expect(single?.id).toBe("single-OB");
    expect(bundles.map((b) => b.id)).toEqual(["bundle-OBSW"]);
  });
  it("uses the cheapest single or bundle price", () => {
    expect(offerFor(products, "OB").from?.amount_satang).toBe(99000);
    expect(offerFor(products, "SW").from?.amount_satang).toBe(149000);
  });
  it("has nothing for codes not on sale", () => {
    const { single, bundles, from } = offerFor(products, "LV");
    expect([single, bundles.length, from]).toEqual([undefined, 0, null]);
  });
});
