"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import type { AdminState } from "../actions";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาเลือกวันที่");

const BriefSchema = z.object({
  brief_date: day,
  story: z.string().trim().min(1, "กรุณากรอกสรุป").max(6000),
  facts: z.string().trim().max(6000).default(""),
});

const refresh = () => { revalidatePath("/admin/content"); revalidatePath("/news"); revalidatePath("/dashboard"); };

export async function saveBrief(_: AdminState, form: FormData): Promise<AdminState> {
  const parsed = BriefSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("daily_briefs").upsert(parsed.data);
  if (error) return { error: "บันทึกสรุปไม่สำเร็จ" };
  refresh();
  return { ok: `บันทึกสรุปวันที่ ${parsed.data.brief_date} แล้ว` };
}

export async function deleteBrief(date: string) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("daily_briefs").delete().eq("brief_date", day.parse(date));
  if (error) throw new Error("ลบไม่สำเร็จ");
  refresh();
}

const NewsSchema = z.object({
  title: z.string().trim().min(1, "กรุณากรอกหัวข้อ").max(300),
  title_th: z.string().trim().max(300).optional(),
  link: z.url({ protocol: /^https?$/, error: "ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://" }),
  source: z.string().trim().min(1, "กรุณากรอกแหล่งข่าว").max(80),
  gold_impact: z.string().trim().max(500).optional(),
  // datetime-local in Bangkok time
  published_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "กรุณาเลือกเวลาเผยแพร่"),
});

export async function addNews(_: AdminState, form: FormData): Promise<AdminState> {
  const parsed = NewsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const v = parsed.data;
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("news_items").insert({
    title: v.title, title_th: v.title_th || null, link: v.link, source: v.source, gold_impact: v.gold_impact || null,
    published_at: new Date(`${v.published_at}:00+07:00`).toISOString(),
  });
  if (error) return { error: error.code === "23505" ? "มีข่าวลิงก์นี้อยู่แล้ว" : "เพิ่มข่าวไม่สำเร็จ" };
  refresh();
  return { ok: "เพิ่มข่าวแล้ว" };
}

export async function deleteNews(id: number) {
  const { supabase } = await requireStaff();
  const { error } = await supabase.from("news_items").delete().eq("id", z.number().int().parse(id));
  if (error) throw new Error("ลบไม่สำเร็จ");
  refresh();
}
