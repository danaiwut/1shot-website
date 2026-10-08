"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { IMAGE_TYPES, MAX_IMAGE } from "@/lib/images";
import { INDICATOR_IMAGE_BUCKET, isStoredImage } from "@/lib/indicators";
import { createAdminClient } from "@/lib/supabase/admin";
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

export async function revokeRight(userId: string, code: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("indicator_rights").delete().eq("user_id", uuid.parse(userId)).eq("code", code);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/members/${userId}`);
}

export async function unlinkTelegram(userId: string) {
  const { supabase, userId: staffId } = await requireStaff();
  const { error } = await supabase.from("telegram_links").delete().eq("user_id", uuid.parse(userId));
  if (error) throw new Error(error.message);
  await createAdminClient().from("audit_log").insert({ actor_id: staffId, subject_id: userId, action: "telegram.unlink" });
  revalidatePath(`/admin/members/${userId}`);
}


const IndicatorSchema = z.object({
  code: z.string().regex(/^[A-Z]{2,4}$/),
  name: z.string().trim().min(1, "กรุณาใส่ชื่อ").max(80),
  description: z.string().trim().max(300),
  points: z.string().max(3000).transform((v) => v.split("\n").map((l) => l.trim()).filter(Boolean)).pipe(z.array(z.string().max(200)).max(8, "จุดเด่นได้ไม่เกิน 8 ข้อ")),
  telegram_room_id: z.string().trim().regex(/^(-?\d{5,20})?$/, "Chat ID ต้องเป็นตัวเลข เช่น -1001234567890").optional(),
  tv_script_id: z.string().trim().regex(/^(PUB;[A-Za-z0-9]{6,64})?$/, "TradingView script ID ต้องขึ้นต้นด้วย PUB;").optional(),
});

/** Edit an indicator's public content, Telegram room and preview image (stored in the public indicator-images bucket). */
export async function saveIndicator(_: AdminState, form: FormData): Promise<AdminState> {
  const parsed = IndicatorSchema.safeParse({
    code: form.get("code"), name: form.get("name"), description: form.get("description") ?? "",
    points: form.get("points") ?? "", telegram_room_id: form.get("telegram_room_id") ?? undefined, tv_script_id: form.get("tv_script_id") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const { code, telegram_room_id, tv_script_id, ...content } = parsed.data;
  const { supabase } = await requireStaff();
  const { data: current } = await supabase.from("indicators").select("image_path").eq("code", code).maybeSingle<{ image_path: string | null }>();
  if (!current) return { error: "ไม่พบอินดิเคเตอร์" };

  const storage = createAdminClient().storage.from(INDICATOR_IMAGE_BUCKET);
  let image_path = current.image_path;
  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    const type = IMAGE_TYPES[file.type];
    if (!type) return { error: "รองรับเฉพาะไฟล์ PNG, JPG หรือ WebP" };
    if (file.size > MAX_IMAGE) return { error: "รูปต้องมีขนาดไม่เกิน 5 MB" };
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!type.magic(bytes)) return { error: "ไฟล์ไม่ใช่รูปภาพที่ถูกต้อง" };
    const path = `${code}/${crypto.randomUUID()}.${type.ext}`;
    const { error } = await storage.upload(path, bytes, { contentType: file.type, cacheControl: "31536000", upsert: false });
    if (error) return { error: "อัปโหลดรูปไม่สำเร็จ" };
    image_path = path;
  } else if (form.get("remove_image") === "on") {
    image_path = null;
  }

  const { error } = await supabase.from("indicators").update({
    ...content,
    image_path,
    ...(telegram_room_id !== undefined && { telegram_room_id: telegram_room_id || null }),
    ...(tv_script_id !== undefined && { tv_script_id: tv_script_id || null }),
  }).eq("code", code);
  if (error) {
    if (image_path && image_path !== current.image_path) await storage.remove([image_path]);
    return { error: "บันทึกไม่สำเร็จ" };
  }
  if (isStoredImage(current.image_path) && current.image_path !== image_path) await storage.remove([current.image_path]);

  revalidatePath("/admin/indicators");
  revalidatePath("/");
  revalidatePath(`/indicators/${code}`);
  return { ok: "บันทึกแล้ว" };
}
