"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";

export type PromoState = { error?: string; ok?: string };

const opt = (max: number) => z.string().trim().max(max).transform((v) => v || null);
const link = z.string().trim().max(300).refine((v) => !v || /^\/[^/]/.test(v) || /^https:\/\//.test(v), "ลิงก์ต้องขึ้นต้นด้วย / หรือ https://").transform((v) => v || null);
const Schema = z.object({
  id: z.uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "กรุณาใส่หัวข้อ").max(120),
  body: z.string().trim().max(600),
  badge: opt(40),
  code: z.string().trim().max(40).regex(/^([A-Za-z0-9_-]{2,40})?$/, "โค้ดใช้ได้เฉพาะ A–Z, 0–9, - และ _").transform((v) => v || null),
  cta_label: opt(40),
  cta_href: link,
  image_url: link.optional().transform((v) => v ?? null),
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาเลือกวันเริ่ม"),
  ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาเลือกวันสิ้นสุด"),
}).refine((v) => v.ends_on >= v.starts_on, { message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม" });

export async function savePromotion(_: PromoState, form: FormData): Promise<PromoState> {
  const parsed = Schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const { id, ...row } = parsed.data;
  const { supabase, userId } = await requireStaff();
  const data = { ...row, active: form.get("active") === "on" };
  const { error } = id
    ? await supabase.from("promotions").update(data).eq("id", id)
    : await supabase.from("promotions").insert({ ...data, created_by: userId });
  if (error) return { error: "บันทึกไม่สำเร็จ" };
  revalidatePath("/admin/promotions");
  revalidatePath("/");
  return { ok: id ? "บันทึกการแก้ไขแล้ว" : "สร้างโปรโมชันแล้ว" };
}

export async function deletePromotion(id: string) {
  const { supabase } = await requireStaff();
  await supabase.from("promotions").delete().eq("id", z.uuid().parse(id));
  revalidatePath("/admin/promotions");
  revalidatePath("/");
}
