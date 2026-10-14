"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { IMAGE_TYPES, MAX_IMAGE } from "@/lib/images";
import { PROMOTION_IMAGE_BUCKET } from "@/lib/promotions";
import { createAdminClient } from "@/lib/supabase/admin";

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
  image_scope: z.enum(["home", "all"]).default("home"),
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาเลือกวันเริ่ม"),
  ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาเลือกวันสิ้นสุด"),
}).refine((v) => v.ends_on >= v.starts_on, { message: "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม" });

/** A public Storage URL's object key within our bucket, or null if it isn't one of ours (so we never try to delete it). */
function storageKeyOf(url: string | null) {
  if (!url) return null;
  const marker = `/${PROMOTION_IMAGE_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

export async function savePromotion(_: PromoState, form: FormData): Promise<PromoState> {
  const parsed = Schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const { id, ...row } = parsed.data;
  const { supabase, userId } = await requireStaff();

  let currentImageUrl: string | null = null;
  if (id) {
    const { data } = await supabase.from("promotions").select("image_url").eq("id", id).maybeSingle<{ image_url: string | null }>();
    currentImageUrl = data?.image_url ?? null;
  }

  const admin = createAdminClient();
  const storage = admin.storage.from(PROMOTION_IMAGE_BUCKET);
  let image_url = currentImageUrl;
  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    const type = IMAGE_TYPES[file.type];
    if (!type) return { error: "รองรับเฉพาะไฟล์ PNG, JPG หรือ WebP" };
    if (file.size > MAX_IMAGE) return { error: "รูปต้องมีขนาดไม่เกิน 5 MB" };
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!type.magic(bytes)) return { error: "ไฟล์ไม่ใช่รูปภาพที่ถูกต้อง" };
    const path = `${crypto.randomUUID()}.${type.ext}`;
    const { error } = await storage.upload(path, bytes, { contentType: file.type, cacheControl: "31536000", upsert: false });
    if (error) return { error: "อัปโหลดรูปไม่สำเร็จ" };
    image_url = storage.getPublicUrl(path).data.publicUrl;
  } else if (form.get("remove_image") === "on") {
    image_url = null;
  }

  const data = { ...row, image_url, active: form.get("active") === "on" };
  const { error } = id
    ? await supabase.from("promotions").update(data).eq("id", id)
    : await supabase.from("promotions").insert({ ...data, created_by: userId });
  if (error) {
    const newKey = storageKeyOf(image_url);
    if (newKey && image_url !== currentImageUrl) await storage.remove([newKey]);
    return { error: "บันทึกไม่สำเร็จ" };
  }
  const oldKey = storageKeyOf(currentImageUrl);
  if (oldKey && currentImageUrl !== image_url) await storage.remove([oldKey]);

  revalidatePath("/admin/promotions");
  revalidatePath("/");
  return { ok: id ? "บันทึกการแก้ไขแล้ว" : "สร้างโปรโมชันแล้ว" };
}

export async function deletePromotion(id: string) {
  const { supabase } = await requireStaff();
  const parsedId = z.uuid().parse(id);
  const { data } = await supabase.from("promotions").select("image_url").eq("id", parsedId).maybeSingle<{ image_url: string | null }>();
  await supabase.from("promotions").delete().eq("id", parsedId);
  const key = storageKeyOf(data?.image_url ?? null);
  if (key) await createAdminClient().storage.from(PROMOTION_IMAGE_BUCKET).remove([key]);
  revalidatePath("/admin/promotions");
  revalidatePath("/");
}
