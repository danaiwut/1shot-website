"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import type { Role } from "@/lib/types";

export type AdminState = { error?: string; ok?: string };
const uuid = z.uuid();

export async function setIbVerified(userId: string, verified: boolean) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("profiles").update({ ib_verified: verified }).eq("id", uuid.parse(userId));
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/members/${userId}`);
}

export async function setRole(userId: string, role: Role) {
  const { supabase, profile } = await requireStaff();
  if (profile.role !== "owner") throw new Error("เฉพาะเจ้าของระบบ");
  if (userId === profile.id) throw new Error("เปลี่ยนบทบาทของตัวเองไม่ได้");
  const { error } = await supabase.from("profiles").update({ role: z.enum(["member", "admin", "owner"]).parse(role) }).eq("id", uuid.parse(userId));
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/members/${userId}`);
}

const RightSchema = z.object({
  user_id: uuid,
  code: z.string().regex(/^[A-Z]{2,4}$/),
  duration: z.enum(["lifetime", "date"]),
  expires_on: z.string().optional(),
  note: z.string().trim().max(200).optional(),
});

export async function grantRight(_: AdminState, form: FormData): Promise<AdminState> {
  const parsed = RightSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "ข้อมูลไม่ถูกต้อง" };
  const v = parsed.data;
  let expires_at: string | null = null;
  if (v.duration === "date") {
    if (!v.expires_on || !/^\d{4}-\d{2}-\d{2}$/.test(v.expires_on)) return { error: "กรุณาเลือกวันหมดอายุ" };
    // End of that day in Bangkok time.
    expires_at = new Date(`${v.expires_on}T23:59:59+07:00`).toISOString();
  }
  const { supabase, userId: staffId } = await requireStaff();
  const { error } = await supabase.from("indicator_rights").upsert({
    user_id: v.user_id, code: v.code, expires_at, note: v.note || null, granted_by: staffId,
  });
  if (error) return { error: "บันทึกสิทธิ์ไม่สำเร็จ" };
  revalidatePath(`/admin/members/${v.user_id}`);
  return { ok: `ให้สิทธิ์ ${v.code} แล้ว` };
}

export async function revokeRight(userId: string, code: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("indicator_rights").delete().eq("user_id", uuid.parse(userId)).eq("code", code);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/members/${userId}`);
}

export async function unlinkTelegram(userId: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("telegram_links").delete().eq("user_id", uuid.parse(userId));
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/members/${userId}`);
}

export async function saveRoom(_: AdminState, form: FormData): Promise<AdminState> {
  const code = String(form.get("code") ?? "");
  const room = String(form.get("telegram_room_id") ?? "").trim();
  if (room && !/^-?\d{5,20}$/.test(room)) return { error: "Chat ID ต้องเป็นตัวเลข เช่น -1001234567890" };
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("indicators").update({ telegram_room_id: room || null }).eq("code", code);
  if (error) return { error: "บันทึกไม่สำเร็จ" };
  revalidatePath("/admin/indicators");
  return { ok: "บันทึกแล้ว" };
}
