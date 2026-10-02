import "server-only";
import Stripe from "stripe";
import { serverEnv } from "../env";

export class StoreError extends Error {}

let client: Stripe | undefined;

export function getStripe() {
  const key = serverEnv.stripeSecretKey();
  if (!key) throw new StoreError("ยังไม่ได้ตั้งค่า Stripe (STRIPE_SECRET_KEY)");
  client ??= new Stripe(key, { appInfo: { name: "1SHOT Signals" } });
  return client;
}

/** End of the paid period. Lives on the subscription items in current API versions. */
export function periodEnd(sub: Stripe.Subscription): Date | null {
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const ts = sub.items?.data?.[0]?.current_period_end ?? legacy;
  return ts ? new Date(ts * 1000) : null;
}

export function invoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  const viaParent = inv.parent?.subscription_details?.subscription;
  const legacy = (inv as unknown as { subscription?: string | Stripe.Subscription | null }).subscription;
  const s = viaParent ?? legacy;
  return typeof s === "string" ? s : s?.id ?? null;
}

export const idOf = (x: string | { id: string } | null | undefined) => (typeof x === "string" ? x : x?.id ?? null);
