"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { IMAGE_TYPES, MAX_IMAGE } from "@/lib/images";
import { CARD_IMAGE_BUCKET } from "@/lib/promotions";
import { createAdminClient } from "@/lib/supabase/admin";

export type ProductState = { error?: string; ok?: string };

const cardImages = () => createAdminClient().storage.from(CARD_IMAGE_BUCKET);

/** Object key of a card image we uploaded, or null for anything else (never delete what isn't ours). */
function storageKeyOf(url: string | null) {
  const marker = `/${CARD_IMAGE_BUCKET}/`;
  const i = url?.indexOf(marker) ?? -1;
  return i === -1 ? null : url!.slice(i + marker.length);
}

/**
 * The card image after this save: a newly uploaded file, null when "ลบรูปนี้" is ticked, else unchanged.
 * Returns an error message for a bad file.
 */
async function nextCardImage(form: FormData, current: string | null): Promise<{ url: string | null; uploaded: boolean } | { error: string }> {
  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    const type = IMAGE_TYPES[file.type];
    if (!type) return { error: "รองรับเฉพาะไฟล์ PNG, JPG หรือ WebP" };
    if (file.size > MAX_IMAGE) return { error: "รูปต้องมีขนาดไม่เกิน 5 MB" };
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!type.magic(bytes)) return { error: "ไฟล์ไม่ใช่รูปภาพที่ถูกต้อง" };
    const path = `products/${crypto.randomUUID()}.${type.ext}`;
    const { error } = await cardImages().upload(path, bytes, { contentType: file.type, cacheControl: "31536000", upsert: false });
    if (error) return { error: "อัปโหลดรูปไม่สำเร็จ" };
    return { url: cardImages().getPublicUrl(path).data.publicUrl, uploaded: true };
  }
  return { url: form.get("remove_image") === "on" ? null : current, uploaded: false };
}

async function removeCardImage(url: string | null) {
  const key = storageKeyOf(url);
  if (key) await cardImages().remove([key]);
}

const ProductSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อสินค้า").max(120),
  description: z.string().trim().max(600),
  kind: z.enum(["single", "bundle", "pick"]),
  codes: z.array(z.string().regex(/^[A-Z]{2,4}$/)).min(1, "เลือกอินดิเคเตอร์อย่างน้อย 1 ตัว"),
  pick_count: z.coerce.number().int().min(1).max(20).nullable(),
  audience: z.enum(["all", "returning"]),
  // Bangkok end-of-day for the chosen date; empty = no end.
  available_until: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "วันที่ไม่ถูกต้อง").transform((d) => (d ? `${d}T23:59:59+07:00` : null)),
  badge: z.string().trim().max(24).transform((b) => b || null),
  features: z.array(z.string().trim().min(1).max(120)).max(12),
  active: z.boolean(),
  featured: z.boolean(),
  sort: z.coerce.number().int().min(0).max(10_000),
  image_scope: z.enum(["home", "all"]),
});

function parseProduct(form: FormData) {
  const kind = form.get("kind");
  return ProductSchema.refine((p) => p.kind !== "single" || p.codes.length === 1, "สินค้ารายตัวเลือกได้ 1 อินดิเคเตอร์")
    .refine((p) => p.kind !== "bundle" || p.codes.length >= 2, "แพ็กเกจรวมต้องมีอย่างน้อย 2 ตัว")
    .refine((p) => p.kind !== "pick" || (p.pick_count !== null && p.pick_count <= p.codes.length), "จำนวนที่ให้เลือกต้องไม่เกินจำนวนอินดิเคเตอร์ในโปร")
    .safeParse({
    pick_count: kind === "pick" ? form.get("pick_count") || 2 : null,
    audience: form.get("audience") || "all",
    available_until: String(form.get("available_until") ?? ""),
    badge: String(form.get("badge") ?? ""),
    name: form.get("name"),
    description: form.get("description") ?? "",
    kind: form.get("kind"),
    codes: form.getAll("codes").map(String),
    features: String(form.get("features") ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    active: form.get("active") === "on",
    featured: form.get("featured") === "on",
    sort: form.get("sort") || 100,
    image_scope: form.get("image_scope") === "all" ? "all" : "home",
  });
}

export async function createProduct(_: ProductState, form: FormData): Promise<ProductState> {
  const parsed = parseProduct(form);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const { supabase } = await requireStaff();
  const image = await nextCardImage(form, null);
  if ("error" in image) return { error: image.error };
  const { data, error } = await supabase.from("products").insert({ ...parsed.data, image_url: image.url }).select("id").single<{ id: string }>();
  if (error || !data) {
    if (image.uploaded) await removeCardImage(image.url);
    return { error: "บันทึกไม่สำเร็จ" };
  }
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect(`/admin/products/${data.id}`);
}

export async function updateProduct(_: ProductState, form: FormData): Promise<ProductState> {
  const id = z.uuid().safeParse(form.get("id"));
  const parsed = parseProduct(form);
  if (!id.success || !parsed.success) return { error: parsed.error?.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const { supabase } = await requireStaff();
  const { data: current } = await supabase.from("products").select("image_url").eq("id", id.data).maybeSingle<{ image_url: string | null }>();
  if (!current) return { error: "ไม่พบสินค้า" };
  const image = await nextCardImage(form, current.image_url);
  if ("error" in image) return { error: image.error };
  const { error } = await supabase.from("products").update({ ...parsed.data, image_url: image.url }).eq("id", id.data);
  if (error) {
    if (image.uploaded) await removeCardImage(image.url);
    return { error: "บันทึกไม่สำเร็จ" };
  }
  if (current.image_url !== image.url) await removeCardImage(current.image_url);
  revalidatePath("/admin/products", "layout");
  revalidatePath("/", "layout");
  return { ok: "บันทึกแล้ว" };
}

export async function deleteProduct(id: string) {
  const { supabase } = await requireStaff();
  const productId = z.uuid().parse(id);
  const { data: current } = await supabase.from("products").select("image_url").eq("id", productId).maybeSingle<{ image_url: string | null }>();
  // Orders and subscriptions keep their snapshot (product_id is set null), so deleting is safe.
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new Error("ลบไม่สำเร็จ");
  await removeCardImage(current?.image_url ?? null);
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

const PriceSchema = z.discriminatedUnion("billing", [
  z.object({ billing: z.literal("subscription"), interval: z.enum(["month", "year"]) }),
  z.object({ billing: z.literal("one_time"), duration: z.string() }),
]);

export async function addPrice(_: ProductState, form: FormData): Promise<ProductState> {
  const productId = z.uuid().safeParse(form.get("product_id"));
  const baht = Number(String(form.get("amount") ?? "").replace(/,/g, ""));
  if (!productId.success) return { error: "ข้อมูลไม่ถูกต้อง" };
  if (!Number.isFinite(baht) || baht < 10 || baht > 1_000_000) return { error: "ราคาต้องอยู่ระหว่าง 10 – 1,000,000 บาท" };
  const terms = PriceSchema.safeParse(Object.fromEntries(form));
  if (!terms.success) return { error: "เลือกรูปแบบราคาให้ครบ" };
  if (terms.data.billing === "subscription" && form.get("kind") === "pick") return { error: "โปรแบบเลือกเองขายได้เฉพาะแบบจ่ายครั้งเดียว" };

  let interval: string | null = null;
  let duration_days: number | null = null;
  if (terms.data.billing === "subscription") interval = terms.data.interval;
  else if (terms.data.duration !== "lifetime") {
    duration_days = Number(terms.data.duration === "custom" ? form.get("days") : terms.data.duration);
    if (!Number.isInteger(duration_days) || duration_days < 1 || duration_days > 3650) return { error: "จำนวนวันต้องเป็น 1 – 3650" };
  }

  let max_installments: number | null = null;
  let installment_first_amount_satang: number | null = null;
  if (form.get("installments_on") === "on") {
    if (terms.data.billing !== "one_time" || duration_days !== null) return { error: "ผ่อนชำระได้เฉพาะราคาแบบจ่ายครั้งเดียวและใช้งานตลอดชีพ" };
    max_installments = Number(form.get("max_installments") || 0);
    if (!Number.isInteger(max_installments) || max_installments < 2 || max_installments > 12) return { error: "จำนวนงวดสูงสุดต้องอยู่ระหว่าง 2 – 12 งวด" };
    const firstBaht = Number(String(form.get("installment_first_amount") ?? "").replace(/,/g, ""));
    if (!Number.isFinite(firstBaht) || firstBaht < 10) return { error: "ยอดงวดแรกต้องอย่างน้อย 10 บาท" };
    installment_first_amount_satang = Math.round(firstBaht * 100);
    if (installment_first_amount_satang >= Math.round(baht * 100)) return { error: "ยอดงวดแรกต้องน้อยกว่าราคาเต็ม" };
  }

  const { supabase } = await requireStaff();
  const { error } = await supabase.from("product_prices").insert({
    product_id: productId.data, billing: terms.data.billing, amount_satang: Math.round(baht * 100), currency: "thb",
    interval, duration_days, active: true, sort: Number(form.get("sort") || 100),
    max_installments, installment_first_amount_satang,
  });
  if (error) return { error: "เพิ่มราคาไม่สำเร็จ" };
  revalidatePath(`/admin/products/${productId.data}`);
  return { ok: "เพิ่มราคาแล้ว" };
}

export async function setPriceActive(priceId: string, productId: string, active: boolean) {
  const { supabase } = await requireStaff();
  await supabase.from("product_prices").update({ active }).eq("id", z.uuid().parse(priceId));
  revalidatePath(`/admin/products/${productId}`);
}

export async function deletePrice(priceId: string, productId: string) {
  const { supabase } = await requireStaff();
  await supabase.from("product_prices").delete().eq("id", z.uuid().parse(priceId));
  revalidatePath(`/admin/products/${productId}`);
}
