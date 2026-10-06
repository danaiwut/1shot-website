import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryAdminClient } from "./support/memory-db";
import { DEMO_MEMBER_ID } from "./support/seed";

// Service-role client → in-memory database; Stripe → a fake that records nothing.
vi.mock("../src/lib/supabase/admin", () => ({ createAdminClient: () => createMemoryAdminClient() }));
vi.mock("../src/lib/store/stripe", async (orig) => {
  const real = await orig<typeof import("../src/lib/store/stripe")>();
  const sub = (id: string, status: string) => ({ id, status, metadata: {}, items: { data: [] }, cancel_at_period_end: false, cancel_at: null });
  const fake = {
    customers: { create: async () => ({ id: "cus_test" }) },
    checkout: { sessions: { create: async () => ({ id: `cs_test_${Math.random().toString(36).slice(2)}`, url: "https://checkout.stripe.test/pay" }) } },
    subscriptions: { retrieve: async (id: string) => sub(id, "active"), cancel: async (id: string) => sub(id, "canceled"), update: async (id: string) => sub(id, "active") },
    refunds: { create: async () => ({ id: "re_test" }) },
    invoicePayments: { list: async () => ({ data: [{ payment: { payment_intent: "pi_test_invoice" } }] }) },
  };
  return { ...real, getStripe: () => fake };
});

const { createCheckout, fulfillOrder, refundOrder, revokeOrder } = await import("../src/lib/store/orders");
const { fmtTHB, termLabel } = await import("../src/lib/store/pricing");

const admin = createMemoryAdminClient();
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

/** Checkout + the Stripe webhook that would follow a successful payment. Returns the order id. */
async function buy(user: string, email: string, priceId: string) {
  await createCheckout(user, email, priceId);
  const { data: rows } = await admin.from("orders").select("*").eq("user_id", user).eq("status", "pending").eq("price_id", priceId);
  const order = (rows as { id: string; billing: string; interval: string | null; product_id: string; product_name: string; codes: string[]; amount_satang: number }[]).at(-1)!;
  if (order.billing === "subscription") {
    const end = new Date();
    if (order.interval === "year") end.setFullYear(end.getFullYear() + 1); else end.setMonth(end.getMonth() + 1);
    const subId = `sub_test_${order.id.slice(0, 8)}`;
    await admin.from("subscriptions").upsert({
      id: subId, user_id: user, product_id: order.product_id, price_id: priceId, product_name: order.product_name, codes: order.codes,
      status: "active", interval: order.interval, amount_satang: order.amount_satang, current_period_end: end.toISOString(), cancel_at_period_end: false,
    });
    // completeCheckoutSession stores the first invoice; refunds find the payment through it.
    await admin.from("orders").update({ stripe_invoice_id: `in_test_${order.id.slice(0, 8)}` }).eq("id", order.id);
    await fulfillOrder(order.id, { until: end, subscription: subId });
  } else {
    await fulfillOrder(order.id, { paymentIntent: `pi_test_${order.id.slice(0, 8)}` });
  }
  return order.id;
}

beforeEach(() => { (globalThis as { __mockDb?: unknown }).__mockDb = undefined; });

describe("store fulfilment", () => {
  it("one-time purchase marks the order paid and grants every code of a bundle", async () => {
    const orderId = await buy(USER, "ploy.s@example.com", await priceFor("ICT Pack", "one_time", 90));
    const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
    expect((order as { status: string }).status).toBe("paid");
    for (const code of ["AMD", "AR", "OB", "SW"]) expect(days((await right(USER, code))?.expires_at)).toBe(90);
  });

  it("buying again extends from the current expiry instead of resetting", async () => {
    const price = await priceFor("Orderblock", "one_time", 90);
    await buy(USER, "x@example.com", price);
    await buy(USER, "x@example.com", price);
    expect(days((await right(USER, "OB"))?.expires_at)).toBe(180);
  });

  it("never shortens lifetime access", async () => {
    // The demo member owns SD for life; a 90-day purchase must not cap it.
    await buy(DEMO_MEMBER_ID, "member@1shot.demo", await priceFor("Supply and Demand", "one_time", 90));
    expect((await right(DEMO_MEMBER_ID, "SD"))?.expires_at).toBeNull();
  });

  it("subscription creates the subscription row and grants until the period end", async () => {
    await buy(USER, "x@example.com", await priceFor("All Access", "subscription"));
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

describe("refunds take back exactly what the order gave", () => {
  it("removes rights that only came from the refunded order", async () => {
    const id = await buy(USER, "x@example.com", await priceFor("ICT Pack", "one_time", 90));
    await refundOrder(id);
    for (const code of ["AMD", "AR", "OB", "SW"]) expect(await right(USER, code)).toBeNull();
    const { data } = await admin.from("orders").select("status").eq("id", id).single();
    expect((data as { status: string }).status).toBe("refunded");
  });

  it("keeps time added by other purchases", async () => {
    const price = await priceFor("Orderblock", "one_time", 90);
    const first = await buy(USER, "x@example.com", price);
    await buy(USER, "x@example.com", price);
    expect(days((await right(USER, "OB"))?.expires_at)).toBe(180);
    await refundOrder(first);
    expect(days((await right(USER, "OB"))?.expires_at)).toBe(90);
  });

  it("restores the previous expiry when a lifetime purchase is refunded", async () => {
    // Demo member has OB for ~25 more days, then buys OB for life.
    const before = days((await right(DEMO_MEMBER_ID, "OB"))?.expires_at);
    const id = await buy(DEMO_MEMBER_ID, "member@1shot.demo", await priceFor("Orderblock", "one_time", null));
    expect((await right(DEMO_MEMBER_ID, "OB"))?.expires_at).toBeNull();
    await refundOrder(id);
    expect(days((await right(DEMO_MEMBER_ID, "OB"))?.expires_at)).toBe(before);
  });

  it("never touches access that was already lifetime", async () => {
    const id = await buy(DEMO_MEMBER_ID, "member@1shot.demo", await priceFor("Supply and Demand", "one_time", 90));
    await refundOrder(id);
    expect((await right(DEMO_MEMBER_ID, "SD"))?.expires_at).toBeNull();
  });

  it("subscription refunds take the paid period back and cancel the subscription", async () => {
    const id = await buy(USER, "x@example.com", await priceFor("All Access", "subscription"));
    await refundOrder(id);
    expect(await right(USER, "DT")).toBeNull();
    const { data: subs } = await admin.from("subscriptions").select("status").eq("user_id", USER);
    expect((subs as { status: string }[]).map((x) => x.status)).toEqual(["canceled"]);
    // Cancelled, so the same package can be subscribed to again.
    await expect(createCheckout(USER, "x@example.com", await priceFor("All Access", "subscription"))).resolves.toContain("checkout.stripe.test");
  });

  it("one-time refunds leave subscriptions alone", async () => {
    await buy(USER, "x@example.com", await priceFor("All Access", "subscription"));
    const id = await buy(USER, "x@example.com", await priceFor("Orderblock", "one_time", 90));
    await refundOrder(id);
    const { data: subs } = await admin.from("subscriptions").select("status").eq("user_id", USER);
    expect((subs as { status: string }[]).map((x) => x.status)).toEqual(["active"]);
  });

  it("is idempotent and only refunds paid orders", async () => {
    const id = await buy(USER, "x@example.com", await priceFor("Orderblock", "one_time", 90));
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

describe("customer emails", () => {
  const log = async () => ((await admin.from("email_log").select("*").eq("user_id", USER)).data ?? []) as { kind: string; subject: string; html: string; status: string }[];

  it("logs one purchase email and one refund email per order", async () => {
    const id = await buy(USER, "ploy.s@example.com", await priceFor("ICT Pack", "one_time", 90));
    expect((await log()).map((e) => e.kind)).toEqual(["purchase"]);
    expect((await fulfillOrder(id))).toBe(false); // webhook retry
    await refundOrder(id);
    await revokeOrder(id);
    const mails = await log();
    expect(mails.map((e) => e.kind)).toEqual(["purchase", "refund"]);
    expect(mails[0].html).toContain("ICT Pack");
    expect(mails[0].html).toContain("฿4,990");
    expect(mails[1].subject).toContain("คืนเงิน");
    expect(mails.every((e) => e.status === "logged")).toBe(true); // no RESEND_API_KEY in tests, so nothing is sent
  });

  it("mentions the cancelled subscription in the refund email", async () => {
    const id = await buy(USER, "x@example.com", await priceFor("All Access", "subscription"));
    await refundOrder(id);
    const refund = (await log()).find((e) => e.kind === "refund")!;
    expect(refund.html).toContain("จะไม่มีการตัดเงินงวดถัดไป");
  });

  it("escapes product names", async () => {
    const { purchaseEmail } = await import("../src/lib/email/templates");
    const mail = purchaseEmail({
      id: "abcdef12-0000-4000-8000-000000000000", user_id: USER, product_id: null, price_id: null, product_name: "<script>x</script>", codes: ["OB"],
      billing: "one_time", interval: null, duration_days: 30, amount_satang: 99000, currency: "thb", status: "paid", kind: "checkout",
      stripe_checkout_session_id: null, stripe_payment_intent_id: null, stripe_subscription_id: null, receipt_url: null, access_until: null, created_at: "", paid_at: null,
    }, "Ploy", "https://example.com");
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });
});
