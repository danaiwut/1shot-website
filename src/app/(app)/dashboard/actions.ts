"use server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import { checkTradingViewUser, syncTradingViewRights } from "@/lib/tradingview";

export type TvNameState = { error?: string; ok?: string };

const Name = z.string().trim().min(1, "กรุณาใส่ชื่อผู้ใช้ TradingView").max(64).regex(/^[A-Za-z0-9_.-]+$/, "ใช้ได้เฉพาะ A–Z, 0–9, _ . -");

/** Save the TradingView username from the dashboard dialog, after checking it exists on TradingView. */
export async function saveTradingViewName(_: TvNameState, form: FormData): Promise<TvNameState> {
  const parsed = Name.safeParse(form.get("tradingview"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const tv = await checkTradingViewUser(parsed.data);
  if (!tv.ok && tv.reason === "not_found") return { error: "ไม่พบชื่อผู้ใช้นี้ใน TradingView ตรวจตัวสะกดอีกครั้ง" };
  const { supabase, userId } = await requireViewer();
  const username = tv.ok ? tv.username : parsed.data;
  const { error } = await supabase.from("profiles").update({ tradingview_username: username }).eq("id", userId);
  if (error) return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  // Rights bought before the name was known can now be opened on TradingView.
  const { data: rights } = await supabase.from("indicator_rights").select("code").eq("user_id", userId);
  const codes = (rights ?? []).map((r: { code: string }) => r.code);
  if (codes.length) after(() => syncTradingViewRights(userId, codes));
  revalidatePath("/dashboard");
  revalidatePath("/account");
  return { ok: tv.ok ? `บันทึกแล้ว · พบบัญชี ${username} ใน TradingView` : "บันทึกแล้ว (ตรวจกับ TradingView ไม่ได้ตอนนี้)" };
}
