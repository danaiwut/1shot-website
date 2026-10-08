"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { BLOG_PAGE, fetchFacebookPreview, removeBlogImages, storeBlogImage } from "@/lib/blog";
import { facebookPostUrl } from "@/lib/facebook";

export type BlogState = { error?: string; ok?: string };
export type Preview = { url: string; title: string; description: string; images: string[] };

/** Step 1: read the post's preview from Facebook so staff can check it before saving. */
export async function previewPost(raw: string): Promise<{ error?: string; preview?: Preview }> {
  await requireStaff();
  if (!facebookPostUrl(String(raw ?? ""))) return { error: "ลิงก์ต้องเป็นโพสต์ Facebook (https://www.facebook.com/…)" };
  const preview = await fetchFacebookPreview(String(raw));
  if (!preview) return { error: "ดึงตัวอย่างจาก Facebook ไม่ได้ โพสต์อาจไม่ได้ตั้งเป็นสาธารณะ — กรอกข้อความและใส่รูปเองได้ด้านล่าง" };
  return { preview };
}

const Schema = z.object({
  url: z.string().transform((v, ctx) => facebookPostUrl(v) ?? (ctx.addIssue({ code: "custom", message: "ลิงก์ต้องเป็นโพสต์ Facebook" }), z.NEVER)),
  page_name: z.string().trim().max(80).transform((v) => v || BLOG_PAGE.name),
  body: z.string().trim().max(2000),
  // datetime-local in Bangkok time; empty = now
  posted_at: z.string().regex(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})?$/, "วันที่ไม่ถูกต้อง").transform((v) => (v ? new Date(`${v}:00+07:00`).toISOString() : new Date().toISOString())),
});

/** Step 2: copy the chosen images into our storage (Facebook links expire) and save the post. */
export async function saveBlogPost(_: BlogState, form: FormData): Promise<BlogState> {
  const parsed = Schema.safeParse({ url: form.get("url") ?? "", page_name: form.get("page_name") ?? "", body: form.get("body") ?? "", posted_at: form.get("posted_at") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const { supabase, userId } = await requireStaff();

  const sources: (string | Uint8Array)[] = form.getAll("image_urls").map(String).filter(Boolean);
  for (const f of form.getAll("files")) if (f instanceof File && f.size > 0) sources.push(new Uint8Array(await f.arrayBuffer()));
  const paths: string[] = [];
  for (const src of sources.slice(0, 8)) {
    const path = await storeBlogImage(src);
    if (path) paths.push(path);
  }
  if (!parsed.data.body && !paths.length) return { error: "ต้องมีข้อความหรือรูปอย่างน้อย 1 อย่าง" };

  const { error } = await supabase.from("blog_posts").insert({ ...parsed.data, image_paths: paths, created_by: userId });
  if (error) {
    await removeBlogImages(paths);
    return { error: error.code === "23505" ? "โพสต์นี้เพิ่มไว้แล้ว" : "บันทึกไม่สำเร็จ" };
  }
  revalidatePath("/");
  revalidatePath("/admin/content");
  return { ok: `เพิ่มโพสต์แล้ว${sources.length > paths.length ? ` (รูป ${sources.length - paths.length} รูปใช้ไม่ได้ ข้ามไป)` : ""}` };
}

export async function setBlogActive(id: string, active: boolean) {
  const { supabase } = await requireStaff();
  await supabase.from("blog_posts").update({ active }).eq("id", z.uuid().parse(id));
  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function deleteBlogPost(id: string) {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("blog_posts").delete().eq("id", z.uuid().parse(id)).select("image_paths").maybeSingle<{ image_paths: string[] }>();
  if (data) await removeBlogImages(data.image_paths);
  revalidatePath("/");
  revalidatePath("/admin/content");
}
