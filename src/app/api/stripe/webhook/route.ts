// Stripe webhook. Endpoint: {SITE_URL}/api/stripe/webhook
// Events: checkout.session.completed, checkout.session.async_payment_succeeded,
// checkout.session.async_payment_failed, checkout.session.expired, invoice.paid,
// invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted, charge.refunded
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { serverEnv } from "@/lib/env";
import { completeCheckoutSession, markRefunded, recordRenewal, setOrderStatus, syncSubscription } from "@/lib/store/orders";
import { getStripe, invoiceSubscriptionId } from "@/lib/store/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = serverEnv.stripeWebhookSecret();
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "not configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  // Idempotency: Stripe retries, and may deliver an event more than once.
  const admin = createAdminClient();
  const { data: seen } = await admin.from("stripe_events").select("id").eq("id", event.id).maybeSingle();
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  try {
    await handle(event);
  } catch (err) {
    console.error("stripe webhook failed", event.type, event.id, err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 }); // Stripe retries later
  }
  await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  return NextResponse.json({ received: true });
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return completeCheckoutSession(event.data.object);
    case "checkout.session.async_payment_failed":
      if (event.data.object.metadata?.order_id) await setOrderStatus(event.data.object.metadata.order_id, "failed");
      return;
    case "checkout.session.expired":
      if (event.data.object.metadata?.order_id) await setOrderStatus(event.data.object.metadata.order_id, "canceled");
      return;
    case "invoice.paid":
      return recordRenewal(event.data.object);
    case "invoice.payment_failed": {
      const subId = invoiceSubscriptionId(event.data.object);
      if (subId) await syncSubscription(await getStripe().subscriptions.retrieve(subId));
      return;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return syncSubscription(event.data.object);
    case "charge.refunded":
      return markRefunded(event.data.object);
  }
}
