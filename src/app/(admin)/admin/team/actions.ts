"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type TeamState = { error?: string; ok?: string };

const Schema = z.object({
  email: z.email("อีเมลไม่ถูกต้อง").transform((s) => s.trim().toLowerCase()),
  role: z.enum(["member", "admin"]),
  reason: z.string().trim().min(3, "กรุณาระบุเหตุผลอย่างน้อย 3 ตัวอักษร").max(300),
});

/** Owner-only: promote an existing account to admin, or return an admin to member. The reason goes into the audit trail. */
export async function changeTeamRole(_: TeamState, form: FormData): Promise<TeamState> {
  const parsed = Schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const { supabase, profile } = await requireStaff();
  if (profile.role !== "owner") return { error: "เฉพาะเจ้าของระบบเท่านั้นที่จัดการทีมงานได้" };
  const { email, role, reason } = parsed.data;
  const { data: target } = await supabase.from("profiles").select("id, role, email").ilike("email", email).maybeSingle<{ id: string; role: string; email: string }>();
  if (!target) return { error: "ไม่พบบัญชีนี้ — ให้ผู้ใช้สมัครสมาชิกก่อน แล้วค่อยเพิ่มเป็นทีมงาน" };
  if (target.id === profile.id) return { error: "เปลี่ยนบทบาทของตัวเองไม่ได้" };
  if (target.role === "owner") return { error: "บัญชีนี้เป็นเจ้าของระบบ เปลี่ยนจากหน้านี้ไม่ได้" };
  if (target.role === role) return { error: role === "admin" ? "บัญชีนี้เป็นแอดมินอยู่แล้ว" : "บัญชีนี้ไม่ได้เป็นทีมงาน" };

  const { error } = await supabase.from("profiles").update({ role }).eq("id", target.id);
  if (error) return { error: "บันทึกไม่สำเร็จ" };
  // The profiles trigger wrote the role.change row; attach the reason to it.
  const admin = createAdminClient();
  const { data: row } = await admin.from("audit_log").select("id, detail").eq("subject_id", target.id).eq("action", "role.change")
    .order("created_at", { ascending: false }).limit(1).maybeSingle<{ id: number; detail: Record<string, unknown> }>();
  if (row) await admin.from("audit_log").update({ detail: { ...row.detail, reason } }).eq("id", row.id);

  revalidatePath("/admin/team");
  revalidatePath("/admin/access-history");
  return { ok: role === "admin" ? `เพิ่ม ${target.email} เป็นแอดมินแล้ว` : `ถอด ${target.email} ออกจากทีมงานแล้ว` };
}
