"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireViewer } from "@/lib/auth";

export type SupportState = { error?: string; ok?: string };

const NewRequest = z.object({
  kind: z.enum(["rights", "room", "help"], { message: "เลือกประเภทคำขอ" }),
  indicator_code: z.string().regex(/^[A-Z]{2,4}$/).optional().or(z.literal("")),
  message: z.string().trim().min(5, "เล่ารายละเอียดอย่างน้อย 5 ตัวอักษร").max(4000, "ยาวได้ไม่เกิน 4000 ตัวอักษร"),
});

export async function openRequest(_: SupportState, form: FormData): Promise<SupportState> {
  const parsed = NewRequest.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ครบ" };
  const { supabase, userId } = await requireViewer();
  const { data, error } = await supabase.from("support_requests").insert({
    user_id: userId, kind: parsed.data.kind, indicator_code: parsed.data.indicator_code || null, message: parsed.data.message,
  }).select("id").single<{ id: string }>();
  if (error || !data) return { error: "ส่งคำขอไม่สำเร็จ กรุณาลองใหม่" };
  revalidatePath("/support");
  redirect(`/support/${data.id}?sent=1`);
}

const Reply = z.object({ request_id: z.uuid(), body: z.string().trim().min(1, "พิมพ์ข้อความก่อนส่ง").max(4000) });

export async function replyRequest(_: SupportState, form: FormData): Promise<SupportState> {
  const parsed = Reply.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ครบ" };
  const { supabase, userId } = await requireViewer();
  const { error } = await supabase.from("support_messages").insert({
    request_id: parsed.data.request_id, author_id: userId, from_staff: false, body: parsed.data.body,
  });
  if (error) return { error: "ส่งข้อความไม่สำเร็จ" };
  revalidatePath(`/support/${parsed.data.request_id}`);
  return { ok: "ส่งข้อความแล้ว" };
}
