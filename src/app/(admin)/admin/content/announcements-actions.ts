"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";

export type AnnState = { error?: string; ok?: string };

const Schema = z.object({
  id: z.uuid().optional().or(z.literal("")),
  title: z.string().trim().min(1, "กรุณาใส่หัวข้อ").max(160),
  body: z.string().trim().max(8000),
});

export async function saveAnnouncement(_: AnnState, form: FormData): Promise<AnnState> {
  const parsed = Schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const { supabase, userId } = await requireStaff();
  const row = { title: parsed.data.title, body: parsed.data.body, pinned: form.get("pinned") === "on", published: form.get("published") === "on" };
  const { error } = parsed.data.id
    ? await supabase.from("announcements").update(row).eq("id", parsed.data.id)
    : await supabase.from("announcements").insert({ ...row, created_by: userId });
  if (error) return { error: "บันทึกไม่สำเร็จ" };
  revalidatePath("/admin/content");
  revalidatePath("/announcements");
  return { ok: parsed.data.id ? "บันทึกการแก้ไขแล้ว" : "โพสต์ประกาศแล้ว" };
}

export async function deleteAnnouncement(id: string) {
  const { supabase } = await requireStaff();
  await supabase.from("announcements").delete().eq("id", z.uuid().parse(id));
  revalidatePath("/admin/content");
  revalidatePath("/announcements");
}
