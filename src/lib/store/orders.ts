import "server-only";
import type Stripe from "stripe";
import { sendPurchaseEmail, sendRefundEmail } from "../email/send";
import { publicEnv } from "../env";
import { createAdminClient } from "../supabase/admin";
import type { Order, Product, ProductPrice } from "../types";
import { orderCodes, orderName, PickError } from "./pick";
import { termLabel } from "./pricing";
import { getStripe, idOf, invoiceSubscriptionId, periodEnd, StoreError } from "./stripe";
import { after } from "next/server";
import { syncTradingViewRights } from "../tradingview";

/*
 * Order lifecycle:
 *   createCheckout → order "pending" + Stripe Checkout Session
 *   webhook (checkout.session.completed / async_payment_succeeded) → fulfillOrder → "paid" + rights
 *   invoice.paid (renewals) → new "renewal" order + rights extended to the new period end
 * All writes use the service role; customers can only read their own rows (RLS).
 */

type Admin = ReturnType<typeof createAdminClient>;

/** Run after the response when inside a request (webhook/action); otherwise (scripts, tests) start it now. */
function later(task: () => Promise<void>) {
  try {
    after(task);
  } catch {
    void task();
  }
}

async function loadPrice(admin: Admin, priceId: string) {
  const { data: price } = await admin.from("product_prices").select("*").eq("id", priceId).eq("active", true).maybeSingle<ProductPrice>();
  if (!price) throw new StoreError("ไม่พบราคานี้ หรือปิดขายแล้ว");
  const { data: product } = await admin.from("products").select("*").eq("id", price.product_id).eq("active", true).maybeSingle<Product>();
  if (!product) throw new StoreError("ไม่พบสินค้านี้ หรือปิดขายแล้ว");
  return { price, product };
}

async function ensureCustomer(admin: Admin, userId: string, email: string) {
  const { data } = await admin.from("stripe_customers").select("stripe_customer_id").eq("user_id", userId).maybeSingle();
  if (data?.stripe_customer_id) {
    // Receipts go to the email the customer confirmed on the checkout form.
    try { await getStripe().customers.update(data.stripe_customer_id as string, { email }); } catch { /* keep the old email; never block checkout */ }
    return data.stripe_customer_id as string;
  }
  const customer = await getStripe().customers.create({ email, metadata: { user_id: userId } }, { idempotencyKey: `customer-${userId}` });
  await admin.from("stripe_customers").upsert({ user_id: userId, stripe_customer_id: customer.id });
  return customer.id;
}

/** True when the user has a paid (or refunded) order or holds any indicator right. */
async function isReturningCustomer(admin: Admin, userId: string) {
  const [{ count: orders }, { count: rights }] = await Promise.all([
    admin.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId).in("status", ["paid", "refunded"]),
    admin.from("indicator_rights").select("code", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  return (orders ?? 0) > 0 || (rights ?? 0) > 0;
}

/**
 * Starts a purchase. Returns the Stripe Checkout URL to send the customer to.
 * `chosen` is only used by "pick" products (the customer's choice from the pool).
 */
export async function createCheckout(userId: string, email: string, priceId: string, chosen: string[] = []) {
  const admin = createAdminClient();
  const { price, product } = await loadPrice(admin, priceId);
  const isSub = price.billing === "subscription";

  if (product.available_until && new Date(product.available_until).getTime() <= Date.now()) {
    throw new StoreError("โปรโมชั่นนี้หมดเวลาแล้ว");
  }
  if (product.audience === "returning" && !(await isReturningCustomer(admin, userId))) {
    throw new StoreError("ราคานี้สำหรับลูกค้าที่เคยซื้อแล้วเท่านั้น");
  }
  if (product.kind === "pick" && isSub) throw new StoreError("โปรโมชั่นนี้ขายเฉพาะแบบจ่ายครั้งเดียว");
  let codes: string[];
  try {
    const { data: lifetime } = await admin.from("indicator_rights").select("code").eq("user_id", userId).is("expires_at", null);
    codes = orderCodes(product, chosen, ((lifetime ?? []) as { code: string }[]).map((r) => r.code));
  } catch (err) {
    if (err instanceof PickError) throw new StoreError(err.message);
    throw err;
  }
  const name = orderName(product, codes);

  if (isSub) {
    const { data: existing } = await admin.from("subscriptions").select("id").eq("user_id", userId).eq("product_id", product.id)
      .in("status", ["active", "trialing", "past_due"]).limit(1);
    if (existing?.length) throw new StoreError("คุณสมัครแพ็กเกจนี้แบบรายงวดอยู่แล้ว ดูได้ที่หน้าการชำระเงิน");
  }

  const { data: order, error } = await admin.from("orders").insert({
    user_id: userId, product_id: product.id, price_id: price.id, product_name: name, codes,
    billing: price.billing, interval: price.interval, duration_days: price.duration_days, amount_satang: price.amount_satang,
    currency: "thb", status: "pending", kind: "checkout",
  }).select("id").single<{ id: string }>();
  if (error || !order) throw new StoreError("สร้างคำสั่งซื้อไม่สำเร็จ");

  const stripe = getStripe();
  const meta = { order_id: order.id, user_id: userId, product_id: product.id, price_id: price.id };
  const site = publicEnv.siteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: isSub ? "subscription" : "payment",
    customer: await ensureCustomer(admin, userId, email),
    client_reference_id: userId,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "thb",
        unit_amount: price.amount_satang,
        product_data: { name: `${name} · ${termLabel(price)}`, ...(product.description && { description: product.description.slice(0, 300) }) },
        ...(isSub && { recurring: { interval: price.interval! } }),
      },
    }],
    metadata: meta,
    ...(isSub ? { subscription_data: { metadata: meta } } : { payment_intent_data: { metadata: meta } }),
    allow_promotion_codes: true,
    locale: "th",
    success_url: `${site}/billing/success?order=${order.id}`,
    cancel_url: `${site}/store?canceled=1`,
  }, { idempotencyKey: `checkout-${order.id}` });

  await admin.from("orders").update({ stripe_checkout_session_id: session.id }).eq("id", order.id);
  if (!session.url) throw new StoreError("Stripe ไม่ส่งลิงก์ชำระเงินกลับมา");
  return session.url;
}

/**
 * Marks an order paid and grants its rights. Safe to call more than once: only the call that
 * flips the status does the granting.
 */
export async function fulfillOrder(orderId: string, opts: { until?: Date | null; paymentIntent?: string | null; subscription?: string | null; receiptUrl?: string | null } = {}) {
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").update({
    status: "paid", paid_at: new Date().toISOString(),
    ...(opts.paymentIntent && { stripe_payment_intent_id: opts.paymentIntent }),
    ...(opts.subscription && { stripe_subscription_id: opts.subscription }),
    ...(opts.receiptUrl && { receipt_url: opts.receiptUrl }),
  }).eq("id", orderId).in("status", ["pending", "failed", "canceled"]).select("*").maybeSingle<Order>();
  if (!order) return false;
  await grantForOrder(admin, order, opts.until ?? null);
  const { data: granted } = await admin.from("orders").select("*").eq("id", orderId).single<Order>();
  await sendPurchaseEmail(granted ?? order);
  return true;
}

/** Grants the order's rights and records what changed (orders.grants), so a refund can undo exactly that. */
async function grantForOrder(admin: Admin, order: Order, until: Date | null) {
  const isSub = order.billing === "subscription";
  const { error } = await admin.rpc("grant_order", {
    p_order: order.id,
    // A subscription with an unknown period end still gets a month rather than lifetime.
    p_until: isSub ? (until ?? new Date(Date.now() + 31 * 864e5)).toISOString() : null,
  });
  if (error) throw new Error(`grant_order failed: ${error.message}`);
  // TradingView calls run after the webhook has answered Stripe.
  later(() => syncTradingViewRights(order.user_id, order.codes));
}

export async function setOrderStatus(orderId: string, status: "failed" | "canceled") {
  await createAdminClient().from("orders").update({ status }).eq("id", orderId).eq("status", "pending");
}

/** Mirrors a Stripe subscription into `subscriptions`. */
export async function syncSubscription(sub: Stripe.Subscription) {
  const admin = createAdminClient();
  const m = sub.metadata ?? {};
  const { data: existing } = await admin.from("subscriptions").select("id").eq("id", sub.id).maybeSingle();
  const end = periodEnd(sub);
  const common = {
    status: sub.status,
    cancel_at_period_end: sub.cancel_at_period_end || Boolean(sub.cancel_at),
    current_period_end: end?.toISOString() ?? null,
  };
  if (existing) {
    await admin.from("subscriptions").update(common).eq("id", sub.id);
    return;
  }
  if (!m.user_id || !m.product_id) return; // not created by this app
  const { data: product } = await admin.from("products").select("name, codes").eq("id", m.product_id).maybeSingle<Pick<Product, "name" | "codes">>();
  const item = sub.items.data[0];
  await admin.from("subscriptions").upsert({
    id: sub.id, user_id: m.user_id, product_id: m.product_id, price_id: m.price_id ?? null,
    product_name: product?.name ?? "แพ็กเกจ", codes: product?.codes ?? [],
    interval: item?.price?.recurring?.interval ?? null, amount_satang: item?.price?.unit_amount ?? 0, ...common,
  });
}

/** Paid Checkout Session → order paid. Handles both one-time payments and the first subscription payment. */
export async function completeCheckoutSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;
  const stripe = getStripe();
  if (session.mode === "subscription") {
    const subId = idOf(session.subscription);
    if (!subId) return;
    const sub = await stripe.subscriptions.retrieve(subId);
    await syncSubscription(sub);
    const invoiceId = idOf(session.invoice);
    const invoice = invoiceId ? await stripe.invoices.retrieve(invoiceId) : null;
    await createAdminClient().from("orders").update({ stripe_invoice_id: invoiceId }).eq("id", orderId);
    await fulfillOrder(orderId, { until: periodEnd(sub), subscription: subId, receiptUrl: invoice?.hosted_invoice_url ?? null });
    return;
  }
  const piId = idOf(session.payment_intent);
  if (session.payment_status !== "paid") {
    // PromptPay etc. settle later via checkout.session.async_payment_succeeded.
    if (piId) await createAdminClient().from("orders").update({ stripe_payment_intent_id: piId }).eq("id", orderId);
    return;
  }
  let receiptUrl: string | null = null;
  if (piId) {
    const pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
    receiptUrl = typeof pi.latest_charge === "object" ? pi.latest_charge?.receipt_url ?? null : null;
  }
  await fulfillOrder(orderId, { paymentIntent: piId, receiptUrl });
}

/** Recurring invoice paid → renewal order + rights until the new period end. */
export async function recordRenewal(invoice: Stripe.Invoice) {
  if (invoice.billing_reason === "subscription_create") return; // first payment is handled by the Checkout Session
  const subId = invoiceSubscriptionId(invoice);
  if (!subId || !invoice.id) return;
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subId);
  await syncSubscription(sub);

  const admin = createAdminClient();
  const { data: row } = await admin.from("subscriptions").select("*").eq("id", subId).maybeSingle();
  if (!row) return;
  const { data: order } = await admin.from("orders").upsert({
    user_id: row.user_id, product_id: row.product_id, price_id: row.price_id, product_name: row.product_name, codes: row.codes,
    billing: "subscription", interval: row.interval, amount_satang: invoice.amount_paid, currency: "thb", status: "pending", kind: "renewal",
    stripe_subscription_id: subId, stripe_invoice_id: invoice.id,
  }, { onConflict: "stripe_invoice_id", ignoreDuplicates: true }).select("id").maybeSingle<{ id: string }>();
  if (order) await fulfillOrder(order.id, { until: periodEnd(sub), receiptUrl: invoice.hosted_invoice_url ?? null });
}

/** Full refund → order "refunded" and the access it added is taken back. Partial refunds keep the order paid. */
export async function markRefunded(charge: Stripe.Charge) {
  const pi = idOf(charge.payment_intent);
  if (!pi || !charge.refunded) return;
  const admin = createAdminClient();
  const { data: direct } = await admin.from("orders").select("id").eq("stripe_payment_intent_id", pi);
  let ids = ((direct ?? []) as { id: string }[]).map((o) => o.id);
  if (!ids.length) {
    // Subscription payments are linked through their invoice.
    const payments = await getStripe().invoicePayments.list({ payment: { type: "payment_intent", payment_intent: pi }, limit: 5 });
    const invoices = payments.data.map((p) => idOf(p.invoice)).filter((x): x is string => Boolean(x));
    if (invoices.length) {
      const { data } = await admin.from("orders").select("id").in("stripe_invoice_id", invoices);
      ids = ((data ?? []) as { id: string }[]).map((o) => o.id);
    }
  }
  for (const id of ids) await revokeOrder(id);
}

/** Marks a paid order refunded and removes the rights it granted. Returns false if it was not paid. */
/** If the order belonged to a subscription, that subscription is cancelled immediately too. */
export async function revokeOrder(orderId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("revoke_order", { p_order: orderId });
  if (error) throw new Error(`revoke_order failed: ${error.message}`);
  if (!data) return false;
  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single<Order>();
  if (order) later(() => syncTradingViewRights(order.user_id, order.codes));
  if (order?.stripe_subscription_id) await cancelSubscriptionNow(order.stripe_subscription_id);
  if (order) await sendRefundEmail(order, Boolean(order.stripe_subscription_id));
  return true;
}

/** Ends a subscription right away (no further charges). Safe if it is already cancelled. */
async function cancelSubscriptionNow(subscriptionId: string) {
  const admin = createAdminClient();
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const ended = sub.status === "canceled" || sub.status === "incomplete_expired";
  await syncSubscription(ended ? sub : await stripe.subscriptions.cancel(subscriptionId, { prorate: false, invoice_now: false }));
}

/**
 * Admin refund. Refunds the full payment in Stripe; the charge.refunded webhook then revokes the rights.
 */
export async function refundOrder(orderId: string) {
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle<Order & { stripe_invoice_id: string | null }>();
  if (!order || order.status !== "paid") throw new StoreError("คืนเงินได้เฉพาะคำสั่งซื้อที่ชำระแล้ว");
  const stripe = getStripe();
  let pi = order.stripe_payment_intent_id;
  if (!pi && order.stripe_invoice_id) {
    const payments = await stripe.invoicePayments.list({ invoice: order.stripe_invoice_id, limit: 1 });
    pi = idOf(payments.data[0]?.payment?.payment_intent);
  }
  if (!pi) throw new StoreError("ไม่พบรายการชำระเงินใน Stripe ของคำสั่งซื้อนี้");
  await stripe.refunds.create({ payment_intent: pi }, { idempotencyKey: `refund-${orderId}` });
  // Don't wait for the webhook to show the result.
  await revokeOrder(orderId);
}

/** Customer-initiated cancel / resume. Access always runs to the end of the paid period. */
export async function setCancelAtPeriodEnd(userId: string, subscriptionId: string, cancel: boolean) {
  const admin = createAdminClient();
  const { data: row } = await admin.from("subscriptions").select("id, user_id").eq("id", subscriptionId).maybeSingle();
  if (!row || row.user_id !== userId) throw new StoreError("ไม่พบการสมัครนี้");
  const sub = await getStripe().subscriptions.update(subscriptionId, { cancel_at_period_end: cancel });
  await syncSubscription(sub);
}

/** Stripe-hosted page where the customer updates their card and downloads invoices. */
export async function billingPortalUrl(userId: string) {
  const { data } = await createAdminClient().from("stripe_customers").select("stripe_customer_id").eq("user_id", userId).maybeSingle();
  if (!data?.stripe_customer_id) throw new StoreError("ยังไม่มีข้อมูลการชำระเงินกับ Stripe");
  const session = await getStripe().billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: `${publicEnv.siteUrl()}/store#history` });
  return session.url;
}
