import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/lib/store/catalog";
import { indicatorOffers } from "@/lib/store/offers";

const price = (amount: number) => ({ id: `p${amount}`, amount_satang: amount, billing: "subscription", interval: "month", duration_days: null, active: true, sort: 0, compareSatang: null });
const product = (kind: "single" | "bundle", codes: string[], amount: number) =>
  ({ id: `${kind}-${codes.join("")}`, kind, codes, name: codes.join("+"), prices: [price(amount)] }) as unknown as CatalogProduct;

describe("indicatorOffers", () => {
  const indicators = [
    { code: "OB", is_reference: false },
    { code: "SW", is_reference: false },
    { code: "LV", is_reference: true },
  ];
  const products = [product("single", ["OB"], 99000), product("bundle", ["OB", "SW"], 149000)];

  it("follows the DB list and order", () => {
    expect(indicatorOffers(indicators, products, {}).map((o) => o.code)).toEqual(["OB", "SW", "LV"]);
  });
  it("uses the cheapest single or bundle price", () => {
    const [ob, sw] = indicatorOffers(indicators, products, {});
    expect(ob.price).toContain("990");
    expect(sw.price).toContain("1,490");
  });
  it("marks reference indicators free and flags ownership", () => {
    const offers = indicatorOffers(indicators, [], {}, { OB: null });
    expect(offers.find((o) => o.code === "LV")?.price).toBe("ฟรีสำหรับสมาชิก");
    expect(offers.find((o) => o.code === "SW")?.price).toBe("ยังไม่เปิดขาย");
    expect(offers.find((o) => o.code === "OB")?.owned).toBe(true);
  });
});
