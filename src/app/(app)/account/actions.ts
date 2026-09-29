"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";
import { confirmLink, issueLinkToken, requestRoomInvite, TelegramError } from "@/lib/telegram";

export type FormState = { error?: string; ok?: string };

const ProfileSchema = z.object({
  display_name: z.string().trim().max(60),
  tradingview_username: z.string().trim().max(64).regex(/^[A-Za-z0-9_.-]*$/, "ชื่อผู้ใช้ TradingView ใช้ได้เฉพาะ A-Z 0-9 _ . -"),
  exness_account: z.string().trim().regex(/^(\d{4,20})?$/, "เลขบัญชี Exness ต้องเป็นตัวเลข 4–20 หลัก"),
});

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const parsed = ProfileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase, userId } = await requireViewer();
  const v = parsed.data;
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: v.display_name || null,
      tradingview_username: v.tradingview_username || null,
      exness_account: v.exness_account || null,
    })
    .eq("id", userId);
  if (error) return { error: "บันทึกไม่สำเร็จ" };
  revalidatePath("/", "layout");
  return { ok: "บันทึกแล้ว" };
}

export async function startTelegramLink(): Promise<{ url?: string | null; token?: string; error?: string }> {
  const { userId } = await requireViewer();
  try {
    return await issueLinkToken(userId);
  } catch (err) {
    return { error: err instanceof TelegramError ? err.message : "เกิดข้อผิดพลาด" };
  }
}

export async function confirmTelegramLink(): Promise<FormState> {
  const { userId } = await requireViewer();
  try {
    await confirmLink(userId);
  } catch (err) {
    return { error: err instanceof TelegramError ? err.message : "เกิดข้อผิดพลาด" };
  }
  revalidatePath("/account");
  return { ok: "เชื่อม Telegram แล้ว" };
}

export async function joinRoom(code: string): Promise<{ url?: string; error?: string }> {
  const { userId } = await requireViewer();
  try {
    return { url: await requestRoomInvite(userId, code) };
  } catch (err) {
    return { error: err instanceof TelegramError ? err.message : "สร้างลิงก์เข้าห้องไม่สำเร็จ" };
  }
}
