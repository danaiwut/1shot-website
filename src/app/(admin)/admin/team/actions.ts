"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type TeamState = { error?: string; ok?: string };
export type MemberHit = { id: string; name: string; email: string; tradingview: string | null };

/** Keep letters (any language), digits and a few separators — the rest would break the PostgREST filter. */
const clean = (q: string) => q.normalize("NFC").replace(/[^\p{L}\p{N}@._ -]/gu, "").trim().slice(0, 60);

/** Owner-only suggestions for "เพิ่มแอดมิน": members matching name, email or TradingView (newest first when empty). */
export async function searchMembers(query: string): Promise<MemberHit[]> {
  const { supabase, profile } = await requireStaff();
  if (profile.role !== "owner") return [];
  const q = clean(String(query ?? ""));
  let req = supabase.from("profiles").select("id, email, display_name, tradingview_username").eq("role", "member");
  // Values are double-quoted so spaces and dots stay part of the search text.
  if (q) req = req.or(["email", "display_name", "tradingview_username"].map((c) => `${c}.ilike."*${q}*"`).join(","));
  const { data } = await req.order("created_at", { ascending: false }).limit(8);
  return ((data ?? []) as { id: string; email: string; display_name: string | null; tradingview_username: string | null }[])
    .map((p) => ({ id: p.id, name: p.display_name || p.email.split("@")[0], email: p.email, tradingview: p.tradingview_username }));
}

/** Owner-only: make a member an admin, or return an admin to member. Logged in the audit trail with a reason. */
export async function setTeamRole(userId: string, role: "admin" | "member"): Promise<TeamState> {
  const id = z.uuid().safeParse(userId);
  if (!id.success || !["admin", "member"].includes(role)) return { error: "ข้อมูลไม่ถูกต้อง" };
  const { supabase, profile } = await requireStaff();
  if (profile.role !== "owner") return { error: "เฉพาะเจ้าของระบบเท่านั้นที่จัดการทีมงานได้" };
  const { data: target } = await supabase.from("profiles").select("id, role, email").eq("id", id.data).maybeSingle<{ id: string; role: string; email: string }>();
  if (!target) return { error: "ไม่พบบัญชีนี้" };
  if (target.id === profile.id) return { error: "เปลี่ยนบทบาทของตัวเองไม่ได้" };
  if (target.role === "owner") return { error: "บัญชีนี้เป็นเจ้าของระบบ เปลี่ยนจากหน้านี้ไม่ได้" };
  if (target.role === role) return { ok: role === "admin" ? "เป็นแอดมินอยู่แล้ว" : "ไม่ได้เป็นทีมงานอยู่แล้ว" };

  const { error } = await supabase.from("profiles").update({ role }).eq("id", target.id);
  if (error) return { error: "บันทึกไม่สำเร็จ" };
  // The profiles trigger wrote the role.change row; note who did it from where.
  const admin = createAdminClient();
  const { data: row } = await admin.from("audit_log").select("id, detail").eq("subject_id", target.id).eq("action", "role.change")
    .order("created_at", { ascending: false }).limit(1).maybeSingle<{ id: number; detail: Record<string, unknown> }>();
  if (row) await admin.from("audit_log").update({ detail: { ...row.detail, reason: role === "admin" ? "เพิ่มเป็นแอดมินจากหน้าทีมงาน" : "ถอดจากทีมงานจากหน้าทีมงาน" } }).eq("id", row.id);

  revalidatePath("/admin/team");
  revalidatePath("/admin/logs");
  return { ok: role === "admin" ? `${target.email} เป็นแอดมินแล้ว` : `ถอด ${target.email} ออกจากทีมงานแล้ว` };
}
