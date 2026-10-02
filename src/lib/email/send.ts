import "server-only";
import { publicEnv, serverEnv } from "../env";
import { isMockMode } from "../mock/mode";
import { createAdminClient } from "../supabase/admin";
import type { Order } from "../types";
import { purchaseEmail, refundEmail } from "./templates";

type Kind = "purchase" | "renewal" | "refund";

/**
 * Sends one transactional email per (order, kind) through Resend, and records it in email_log.
 * Never throws: a mail problem must not undo a payment or a refund that already happened.
 * Without RESEND_API_KEY / EMAIL_FROM (or in mockup mode) the email is only logged.
 */
async function deliver(kind: Kind, order: Order, build: (name: string, site: string) => { subject: string; html: string; text: string }) {
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("email, display_name").eq("id", order.user_id).maybeSingle<{ email: string; display_name: string | null }>();
    if (!profile?.email) return;
    const mail = build(profile.display_name || profile.email.split("@")[0], publicEnv.siteUrl());

    // Claim the (order, kind) slot first so a retried webhook never sends twice.
    const { data: claimed } = await admin.from("email_log").upsert({
      user_id: order.user_id, order_id: order.id, kind, to_email: profile.email, subject: mail.subject, html: mail.html, status: "logged",
    }, { onConflict: "order_id,kind", ignoreDuplicates: true }).select("id").maybeSingle<{ id: number }>();
    if (!claimed) return;

    const key = serverEnv.resendApiKey();
    const from = serverEnv.emailFrom();
    if (isMockMode() || !key || !from) return;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json", "idempotency-key": `${kind}-${order.id}` },
      body: JSON.stringify({
        from, to: [profile.email], subject: mail.subject, html: mail.html, text: mail.text,
        ...(serverEnv.emailReplyTo() && { reply_to: serverEnv.emailReplyTo() }),
      }),
      cache: "no-store",
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    await admin.from("email_log").update(res.ok
      ? { status: "sent", provider_id: body.id ?? null }
      : { status: "failed", error: body.message ?? `HTTP ${res.status}` }).eq("id", claimed.id);
  } catch (err) {
    console.error("email failed", kind, order.id, err);
  }
}

export const sendPurchaseEmail = (order: Order) =>
  deliver(order.kind === "renewal" ? "renewal" : "purchase", order, (name, site) => purchaseEmail(order, name, site));

export const sendRefundEmail = (order: Order, subscriptionCanceled: boolean) =>
  deliver("refund", order, (name, site) => refundEmail(order, name, site, subscriptionCanceled));
