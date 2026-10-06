"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer, requireViewer } from "../auth";
import { isSupabaseConfigured } from "../env";
import { billingPortalUrl, createCheckout, setCancelAtPeriodEnd } from "./orders";
import { StoreError } from "./stripe";

export type BuyState = { error?: string };

/** Buy button → Stripe Checkout. */
export async function buy(_: BuyState, form: FormData): Promise<BuyState> {
  const priceId = z.uuid().safeParse(form.get("price_id"));
  if (!priceId.success) return { error: "กรุณาเลือกราคา" };
  const back = String(form.get("from") ?? "/store");
  if (!isSupabaseConfigured()) return { error: "ระบบชำระเงินยังไม่พร้อม" };
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(back.startsWith("/") ? back : "/store")}`);

  let url: string;
  try {
    url = await createCheckout(viewer.userId, viewer.profile.email, priceId.data);
  } catch (err) {
    if (err instanceof StoreError) return { error: err.message };
    console.error("checkout failed", err);
    return { error: "เริ่มการชำระเงินไม่สำเร็จ กรุณาลองใหม่" };
  }
  redirect(url);
}

export async function cancelSubscription(subscriptionId: string, cancel: boolean): Promise<{ error?: string }> {
  const { userId } = await requireViewer();
  try {
    await setCancelAtPeriodEnd(userId, subscriptionId, cancel);
  } catch (err) {
    return { error: err instanceof StoreError ? err.message : "ทำรายการไม่สำเร็จ" };
  }
  revalidatePath("/billing");
  return {};
}

export async function openBillingPortal(): Promise<{ error?: string }> {
  const { userId } = await requireViewer();
  let url: string;
  try {
    url = await billingPortalUrl(userId);
  } catch (err) {
    return { error: err instanceof StoreError ? err.message : "เปิดหน้าจัดการบัตรไม่สำเร็จ" };
  }
  redirect(url);
}
