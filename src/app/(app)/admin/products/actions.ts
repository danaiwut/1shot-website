"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";

export type ProductState = { error?: string; ok?: string };

const ProductSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อสินค้า").max(120),
  description: z.string().trim().max(600),
  kind: z.enum(["single", "bundle"]),
  codes: z.array(z.string().regex(/^[A-Z]{2,4}$/)).min(1, "เลือกอินดิเคเตอร์อย่างน้อย 1 ตัว"),
  features: z.array(z.string().trim().min(1).max(120)).max(12),
  active: z.boolean(),
  featured: z.boolean(),
  sort: z.coerce.number().int().min(0).max(10_000),
});

function parseProduct(form: FormData) {
  return ProductSchema.safeParse({
    name: form.get("name"),
    description: form.get("description") ?? "",
    kind: form.get("kind"),
    codes: form.getAll("codes").map(String),
    features: String(form.get("features") ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    active: form.get("active") === "on",
    featured: form.get("featured") === "on",
    sort: form.get("sort") || 100,
  });
}

export async function createProduct(_: ProductState, form: FormData): Promise<ProductState> {
  const parsed = parseProduct(form);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const { supabase } = await requireStaff();
  const { data, error } = await supabase.from("products").insert(parsed.data).select("id").single<{ id: string }>();
  if (error || !data) return { error: "บันทึกไม่สำเร็จ" };
  revalidatePath("/admin/products");
  redirect(`/admin/products/${data.id}`);
}

export async function updateProduct(_: ProductState, form: FormData): Promise<ProductState> {
  const id = z.uuid().safeParse(form.get("id"));
  const parsed = parseProduct(form);
  if (!id.success || !parsed.success) return { error: parsed.error?.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("products").update(parsed.data).eq("id", id.data);
  if (error) return { error: "บันทึกไม่สำเร็จ" };
  revalidatePath("/admin/products", "layout");
  revalidatePath("/pricing");
  return { ok: "บันทึกแล้ว" };
}

export async function deleteProduct(id: string) {
  const { supabase } = await requireStaff();
  // Orders and subscriptions keep their snapshot (product_id is set null), so deleting is safe.
  const { error } = await supabase.from("products").delete().eq("id", z.uuid().parse(id));
  if (error) throw new Error("ลบไม่สำเร็จ");
  revalidatePath("/admin/products");
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

  let interval: string | null = null;
  let duration_days: number | null = null;
  if (terms.data.billing === "subscription") interval = terms.data.interval;
  else if (terms.data.duration !== "lifetime") {
    duration_days = Number(terms.data.duration === "custom" ? form.get("days") : terms.data.duration);
    if (!Number.isInteger(duration_days) || duration_days < 1 || duration_days > 3650) return { error: "จำนวนวันต้องเป็น 1 – 3650" };
  }

  const { supabase } = await requireStaff();
  const { error } = await supabase.from("product_prices").insert({
    product_id: productId.data, billing: terms.data.billing, amount_satang: Math.round(baht * 100), currency: "thb",
    interval, duration_days, active: true, sort: Number(form.get("sort") || 100),
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
