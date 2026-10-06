"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireViewer } from "../auth";

export type ReviewState = { error?: string; ok?: string };

const ReviewSchema = z.object({
  code: z.string().regex(/^[A-Z]{2,4}$/, "ไม่พบอินดิเคเตอร์"),
  rating: z.coerce.number().int().min(1, "กรุณาให้ดาว 1–5 ดวง").max(5, "กรุณาให้ดาว 1–5 ดวง"),
  body: z.string().trim().max(1000, "ความคิดเห็นยาวได้ไม่เกิน 1,000 ตัวอักษร").default(""),
});

export async function saveReview(_: ReviewState, form: FormData): Promise<ReviewState> {
  const parsed = ReviewSchema.safeParse({ code: form.get("code"), rating: form.get("rating") ?? 0, body: form.get("body") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { code, rating, body } = parsed.data;
  const { supabase, userId } = await requireViewer();
  const { data: indicator } = await supabase.from("indicators").select("code").eq("code", code).maybeSingle();
  if (!indicator) return { error: "ไม่พบอินดิเคเตอร์" };
  // RLS rejects non-buyers too; this check only gives a clearer message.
  const { data: bought } = await supabase.rpc("has_purchased", { p_code: code });
  if (bought !== true) return { error: "รีวิวได้เฉพาะสมาชิกที่ซื้ออินดิเคเตอร์นี้แล้ว" };
  const { error } = await supabase.from("indicator_reviews").upsert({ indicator_code: code, user_id: userId, rating, body });
  if (error) return { error: "บันทึกรีวิวไม่สำเร็จ กรุณาลองใหม่" };
  revalidatePath(`/indicators/${code}`);
  revalidatePath("/");
  return { ok: "บันทึกรีวิวแล้ว ขอบคุณที่แบ่งปัน" };
}

export async function deleteReview(code: string) {
  const { supabase, userId } = await requireViewer();
  await supabase.from("indicator_reviews").delete().eq("indicator_code", code).eq("user_id", userId);
  revalidatePath(`/indicators/${code}`);
  revalidatePath("/");
}
