import { beforeEach, describe, expect, it } from "vitest";
import { createMockAdminClient } from "../src/lib/mock/db";
import { DEMO_MEMBER_ID } from "../src/lib/mock/seed";
import { createCheckout, fulfillOrder, refundOrder, revokeOrder } from "../src/lib/store/orders";
import { fmtTHB, termLabel } from "../src/lib/store/pricing";

const admin = createMockAdminClient();
const USER = "00000000-0000-4000-8000-000000000005"; // no rights in the seed

async function priceFor(name: string, billing: string, days: number | null = null) {
  const { data: products } = await admin.from("products").select("*, product_prices(*)").eq("name", name);
  const p = (products as { product_prices: { id: string; billing: string; duration_days: number | null }[] }[])[0];
  return p.product_prices.find((x) => x.billing === billing && (billing === "subscription" || x.duration_days === days))!.id;
}
async function right(user: string, code: string) {
  const { data } = await admin.from("indicator_rights").select("*").eq("user_id", user).eq("code", code).maybeSingle();
  return data as { expires_at: string | null } | null;
}
const days = (iso: string | null | undefined) => (iso ? Math.round((new Date(iso).getTime() - Date.now()) / 864e5) : null);

beforeEach(() => { (globalThis as { __mockDb?: unknown }).__mockDb = undefined; });

describe("store fulfilment (mockup mode)", () => {
  it("one-time purchase marks the order paid and grants every code of a bundle", async () => {
    const url = await createCheckout(USER, "ploy.s@example.com", await priceFor("ICT Pack", "one_time", 90));
    const orderId = new URL(url, "http://x").searchParams.get("order")!;
    const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
    expect((order as { status: string }).status).toBe("paid");
    for (const code of ["AMD", "AR", "OB", "SW"]) expect(days((await right(USER, code))?.expires_at)).toBe(90);
  });

  it("buying again extends from the current expiry instead of resetting", async () => {
    const price = await priceFor("Orderblock", "one_time", 90);
    await createCheckout(USER, "x@example.com", price);
    await createCheckout(USER, "x@example.com", price);
    expect(days((await right(USER, "OB"))?.expires_at)).toBe(180);
  });

  it("never shortens lifetime access", async () => {
    // The demo member owns SD for life; a 90-day purchase must not cap it.
    await createCheckout(DEMO_MEMBER_ID, "member@1shot.demo", await priceFor("Supply and Demand", "one_time", 90));
    expect((await right(DEMO_MEMBER_ID, "SD"))?.expires_at).toBeNull();
  });

  it("subscription creates the subscription row and grants until the period end", async () => {
    await createCheckout(USER, "x@example.com", await priceFor("All Access", "subscription"));
    const { data: subs } = await admin.from("subscriptions").select("*").eq("user_id", USER);
    expect(subs).toHaveLength(1);
    expect(days((await right(USER, "DT"))?.expires_at)).toBeGreaterThanOrEqual(28);
    await expect(createCheckout(USER, "x@example.com", await priceFor("All Access", "subscription"))).rejects.toThrow(/อยู่แล้ว/);
  });

  it("fulfilling the same order twice grants only once", async () => {
    const { data: order } = await admin.from("orders").insert({
      user_id: USER, product_id: null, price_id: null, product_name: "Test", codes: ["RC"], billing: "one_time",
      interval: null, duration_days: 30, amount_satang: 100000, currency: "thb", status: "pending", kind: "checkout",
    }).select("id").single();
    const id = (order as { id: string }).id;
    expect(await fulfillOrder(id)).toBe(true);
    expect(await fulfillOrder(id)).toBe(false);
    expect(days((await right(USER, "RC"))?.expires_at)).toBe(30);
  });
});

const orderIdOf = (url: string) => new URL(url, "http://x").searchParams.get("order")!;

describe("refunds take back exactly what the order gave", () => {
  it("removes rights that only came from the refunded order", async () => {
    const id = orderIdOf(await createCheckout(USER, "x@example.com", await priceFor("ICT Pack", "one_time", 90)));
    await refundOrder(id);
    for (const code of ["AMD", "AR", "OB", "SW"]) expect(await right(USER, code)).toBeNull();
    const { data } = await admin.from("orders").select("status").eq("id", id).single();
    expect((data as { status: string }).status).toBe("refunded");
  });

  it("keeps time added by other purchases", async () => {
    const price = await priceFor("Orderblock", "one_time", 90);
    const first = orderIdOf(await createCheckout(USER, "x@example.com", price));
    await createCheckout(USER, "x@example.com", price);
    expect(days((await right(USER, "OB"))?.expires_at)).toBe(180);
    await refundOrder(first);
    expect(days((await right(USER, "OB"))?.expires_at)).toBe(90);
  });

  it("restores the previous expiry when a lifetime purchase is refunded", async () => {
    // Demo member has OB for ~25 more days, then buys OB for life.
    const before = days((await right(DEMO_MEMBER_ID, "OB"))?.expires_at);
    const id = orderIdOf(await createCheckout(DEMO_MEMBER_ID, "member@1shot.demo", await priceFor("Orderblock", "one_time", null)));
    expect((await right(DEMO_MEMBER_ID, "OB"))?.expires_at).toBeNull();
    await refundOrder(id);
    expect(days((await right(DEMO_MEMBER_ID, "OB"))?.expires_at)).toBe(before);
  });

  it("never touches access that was already lifetime", async () => {
    const id = orderIdOf(await createCheckout(DEMO_MEMBER_ID, "member@1shot.demo", await priceFor("Supply and Demand", "one_time", 90)));
    await refundOrder(id);
    expect((await right(DEMO_MEMBER_ID, "SD"))?.expires_at).toBeNull();
  });

  it("subscription refunds take the paid period back", async () => {
    const id = orderIdOf(await createCheckout(USER, "x@example.com", await priceFor("All Access", "subscription")));
    await refundOrder(id);
    expect(await right(USER, "DT")).toBeNull();
  });

  it("is idempotent and only refunds paid orders", async () => {
    const id = orderIdOf(await createCheckout(USER, "x@example.com", await priceFor("Orderblock", "one_time", 90)));
    expect(await revokeOrder(id)).toBe(true);
    expect(await revokeOrder(id)).toBe(false);
    await expect(refundOrder(id)).rejects.toThrow(/ชำระแล้ว/);
  });
});

describe("pricing labels", () => {
  it("formats THB and terms", () => {
    expect(fmtTHB(299000)).toBe("฿2,990");
    expect(termLabel({ billing: "subscription", interval: "month", duration_days: null })).toBe("รายเดือน");
    expect(termLabel({ billing: "one_time", interval: null, duration_days: 90 })).toBe("3 เดือน");
    expect(termLabel({ billing: "one_time", interval: null, duration_days: null })).toBe("ตลอดชีพ");
  });
});
