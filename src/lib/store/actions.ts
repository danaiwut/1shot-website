"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { getViewer, requireViewer } from "../auth";
import { isSupabaseConfigured } from "../env";
import { billingPortalUrl, createCheckout, setCancelAtPeriodEnd } from "./orders";
import { StoreError } from "./stripe";
import { autoVerifyIb } from "../exness-ib";
import { checkTradingViewUser } from "../tradingview";
import { parseCodes } from "./pick";

export type BuyState = { error?: string };

/** Buy button → Stripe Checkout. */
export async function buy(_: BuyState, form: FormData): Promise<BuyState> {
  const priceId = z.uuid().safeParse(form.get("price_id"));
  if (!priceId.success) return { error: "กรุณาเลือกราคา" };
  const back = String(form.get("from") ?? "/store");
  if (!isSupabaseConfigured()) return { error: "ระบบชำระเงินยังไม่พร้อม" };
  // Buyers first confirm their TradingView username, trading account and email on /checkout.
  const codes = parseCodes(form.getAll("codes").map(String));
  const next = `/checkout?price=${priceId.data}${codes.length ? `&codes=${codes.join(",")}` : ""}&from=${encodeURIComponent(back.startsWith("/") && !back.startsWith("//") ? back : "/store")}`;
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  redirect(next);
}

export type CheckoutState = { error?: string; field?: "tradingview" | "account" | "email" | "codes" };

const CheckoutSchema = z.object({
  price_id: z.uuid(),
  tradingview: z.string().trim().min(1, "กรุณาใส่ชื่อผู้ใช้ TradingView").max(64).regex(/^[A-Za-z0-9_.-]+$/, "ชื่อผู้ใช้ TradingView ใช้ได้เฉพาะ A–Z, 0–9, _ . -"),
  account: z.string().trim().regex(/^[0-9]{4,20}$/, "เลขบัญชีเทรดต้องเป็นตัวเลข 4–20 หลัก"),
  email: z.email("อีเมลไม่ถูกต้อง").transform((v) => v.trim().toLowerCase()),
});

/** Live check from the checkout form. */
export async function checkTradingViewName(name: string): Promise<{ ok: boolean; username?: string; message: string }> {
  if (!(await getViewer())) return { ok: false, message: "กรุณาเข้าสู่ระบบ" };
  const r = await checkTradingViewUser(String(name).slice(0, 64));
  if (r.ok) return { ok: true, username: r.username, message: `พบบัญชี ${r.username} ใน TradingView` };
  return { ok: false, message: r.reason === "not_found" ? "ไม่พบชื่อผู้ใช้นี้ใน TradingView ตรวจตัวสะกดอีกครั้ง" : "ตรวจสอบกับ TradingView ไม่ได้ตอนนี้ ระบบจะลองใหม่ตอนกดชำระเงิน" };
}

/** Checkout form → save TradingView name + trading account → Stripe Checkout. */
export async function startCheckout(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const parsed = CheckoutSchema.safeParse(Object.fromEntries(form));
  const chosen = parseCodes(form.getAll("codes").map(String));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.message ?? "ข้อมูลไม่ครบ", field: issue?.path[0] as CheckoutState["field"] };
  }
  const v = parsed.data;
  if (!isSupabaseConfigured()) return { error: "ระบบชำระเงินยังไม่พร้อม" };
  const { userId, supabase, profile } = await requireViewer();

  const tv = await checkTradingViewUser(v.tradingview);
  if (!tv.ok && tv.reason === "not_found") return { error: "ไม่พบชื่อผู้ใช้นี้ใน TradingView ตรวจตัวสะกดอีกครั้ง", field: "tradingview" };
  // If TradingView can't be reached we still let the customer pay; staff see the name in the TradingView queue.
  const username = tv.ok ? tv.username : v.tradingview;

  const changes: Record<string, string> = {};
  if (profile.tradingview_username !== username) changes.tradingview_username = username;
  if (profile.exness_account !== v.account) changes.exness_account = v.account;
  if (Object.keys(changes).length) {
    const { error } = await supabase.from("profiles").update(changes).eq("id", userId);
    if (error) return { error: "บันทึกข้อมูลบัญชีไม่สำเร็จ" };
  }
  if (!profile.ib_verified || changes.exness_account) after(() => autoVerifyIb(userId, v.account));

  let url: string;
  try {
    url = await createCheckout(userId, v.email, v.price_id, chosen);
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
