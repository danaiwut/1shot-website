import { describe, expect, it } from "vitest";
import type { CatalogPrice, CatalogProduct } from "@/lib/store/catalog";
import { pairOffers, savingPercent } from "@/lib/store/offers";
import { orderCodes, orderName, parseCodes, PickError } from "@/lib/store/pick";

const lifetime = (id: string, amount: number, parts: Record<string, number> = {}) =>
  ({ id, product_id: "p", currency: "thb", amount_satang: amount, billing: "one_time", interval: null, duration_days: null, active: true, sort: 0, compareSatang: null, parts }) as CatalogPrice;
const product = (p: Partial<CatalogProduct> & Pick<CatalogProduct, "kind" | "codes" | "prices">) =>
  ({ id: `${p.kind}-${p.codes.join("")}`, name: p.codes.join("+"), audience: "all", pick_count: null, names: {}, ...p }) as unknown as CatalogProduct;

const SINGLE = 1_400_000;
const pool = ["DT", "RP", "TF", "AMD", "SW"];
const parts = Object.fromEntries([...pool, "SD"].map((c) => [c, SINGLE]));
const products = [
  ...[...pool, "SD"].map((c) => product({ kind: "single", codes: [c], prices: [lifetime(`s-${c}`, SINGLE)] })),
  product({ kind: "bundle", codes: ["AMD", "SW"], prices: [lifetime("pair", 1_699_900, { AMD: SINGLE, SW: SINGLE })] }),
  product({ kind: "pick", codes: pool, pick_count: 2, prices: [lifetime("oct", 1_500_000, parts)] }),
  product({ kind: "pick", codes: [...pool, "SD"], pick_count: 1, audience: "returning", prices: [lifetime("old", 849_500, parts)] }),
];

describe("pairOffers (จับคู่)", () => {
  it("offers the cheapest deal for each partner, against both single prices", () => {
    const pairs = pairOffers(products, "AMD");
    expect(pairs.map((p) => p.partner).sort()).toEqual(["DT", "RP", "SW", "TF"]);
    const sw = pairs.find((p) => p.partner === "SW")!;
    expect(sw.price.id).toBe("oct"); // 15,000 pick-2 beats the 16,999 fixed pair
    expect(sw.compareSatang).toBe(2_800_000);
  });
  it("falls back to the fixed pair when no pick deal covers both", () => {
    const withoutPick = products.filter((p) => p.kind !== "pick");
    const pairs = pairOffers(withoutPick, "AMD");
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ partner: "SW", compareSatang: 2_800_000 });
    expect(pairs[0].price.amount_satang).toBe(1_699_900);
  });
  it("has nothing for an indicator outside every deal", () => {
    expect(pairOffers(products, "SD")).toEqual([]);
  });
  it("only offers returning-customer deals to returning customers", () => {
    const only = [product({ kind: "pick", codes: ["DT", "RP"], pick_count: 2, audience: "returning", prices: [lifetime("r", 900_000, parts)] })];
    expect(pairOffers(only, "DT")).toEqual([]);
    expect(pairOffers(only, "DT", true)).toHaveLength(1);
  });
});

describe("savingPercent", () => {
  it("rounds down and ignores non-savings", () => {
    expect(savingPercent(2_800_000, 1_699_900)).toBe(39);
    expect(savingPercent(2_800_000, 1_500_000)).toBe(46);
    expect(savingPercent(null, 100)).toBeNull();
    expect(savingPercent(100, 100)).toBeNull();
  });
});

describe("orderCodes", () => {
  const oct = { kind: "pick" as const, codes: pool, pick_count: 2, name: "โปรตุลาคม" };
  it("returns the chosen codes in pool order", () => {
    expect(orderCodes(oct, ["SW", "DT"])).toEqual(["DT", "SW"]);
    expect(orderName(oct, ["DT", "SW"])).toBe("โปรตุลาคม (DT + SW)");
  });
  it("requires exactly pick_count codes from the pool", () => {
    expect(() => orderCodes(oct, ["DT"])).toThrow(PickError);
    expect(() => orderCodes(oct, ["DT", "RP", "TF"])).toThrow(/2 ตัว/);
    expect(() => orderCodes(oct, ["DT", "SD"])).toThrow(/SD ไม่อยู่ในโปรโมชั่นนี้/);
  });
  it("refuses codes the buyer already has for life", () => {
    expect(() => orderCodes(oct, ["DT", "SW"], ["SW"])).toThrow(/SW แบบตลอดชีพแล้ว/);
  });
  it("leaves singles and bundles alone", () => {
    const bundle = { kind: "bundle" as const, codes: ["AMD", "SW"], pick_count: null, name: "คู่" };
    expect(orderCodes(bundle, ["DT"])).toEqual(["AMD", "SW"]);
    expect(orderName(bundle, ["AMD", "SW"])).toBe("คู่");
  });
  it("parses the codes query safely", () => {
    expect(parseCodes("amd, SW,,sw,<x>")).toEqual(["AMD", "SW"]);
    expect(parseCodes(["dt", "DT", "toolong"])).toEqual(["DT"]);
  });
});
