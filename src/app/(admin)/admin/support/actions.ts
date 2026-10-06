"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { requestSubject } from "@/lib/support";
import type { SupportRequest } from "@/lib/types";

export type StaffState = { error?: string; ok?: string };

const Reply = z.object({ request_id: z.uuid(), body: z.string().trim().min(1, "พิมพ์คำตอบก่อนส่ง").max(4000) });

export async function staffReply(_: StaffState, form: FormData): Promise<StaffState> {
  const parsed = Reply.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ครบ" };
  const { supabase, userId } = await requireStaff();
  const { data: req } = await supabase.from("support_requests").select("*").eq("id", parsed.data.request_id).maybeSingle<SupportRequest>();
  if (!req) return { error: "ไม่พบคำขอ" };
  const { error } = await supabase.from("support_messages").insert({ request_id: req.id, author_id: userId, from_staff: true, body: parsed.data.body });
  if (error) return { error: "ส่งคำตอบไม่สำเร็จ" };
  if (!req.assigned_to) await supabase.from("support_requests").update({ assigned_to: userId }).eq("id", req.id);
  // Shows up in the member's "ประวัติของฉัน".
  await createAdminClient().from("audit_log").insert({ actor_id: userId, subject_id: req.user_id, action: "support.reply", detail: { request_id: req.id, subject: requestSubject(req.kind, req.indicator_code) } });
  revalidatePath(`/admin/support/${req.id}`);
  revalidatePath("/admin/support");
  return { ok: "ส่งคำตอบแล้ว" };
}

export async function setRequestStatus(id: string, status: "open" | "resolved") {
  const { supabase } = await requireStaff();
  await supabase.from("support_requests").update({ status }).eq("id", z.uuid().parse(id));
  revalidatePath(`/admin/support/${id}`);
  revalidatePath("/admin/support");
}

export async function assignToMe(id: string) {
  const { supabase, userId } = await requireStaff();
  await supabase.from("support_requests").update({ assigned_to: userId }).eq("id", z.uuid().parse(id));
  revalidatePath(`/admin/support/${id}`);
}
