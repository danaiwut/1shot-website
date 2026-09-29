"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string; email?: string };

const safeNext = (next: FormDataEntryValue | null) => {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
};

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      email,
      error: error.code === "email_not_confirmed" ? "กรุณายืนยันอีเมลก่อน ตรวจกล่องจดหมายของคุณ" : "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    };
  }
  redirect(safeNext(form.get("next")));
}

const SignupSchema = z.object({
  display_name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(60),
  email: z.email("อีเมลไม่ถูกต้อง").transform((v) => v.toLowerCase()),
  password: z.string().min(10, "รหัสผ่านอย่างน้อย 10 ตัวอักษร").max(128),
});

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = SignupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email: String(form.get("email") ?? "") };
  const { email, password, display_name } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name }, emailRedirectTo: `${publicEnv.siteUrl()}/auth/confirm?next=/dashboard` },
  });
  if (error) return { email, error: error.code === "weak_password" ? "รหัสผ่านคาดเดาง่ายเกินไป" : "สมัครไม่สำเร็จ กรุณาลองใหม่" };
  // Same message whether or not the address already exists, to avoid account enumeration.
  return { email, message: `ส่งลิงก์ยืนยันไปที่ ${email} แล้ว เปิดอีเมลเพื่อเปิดใช้งานบัญชี` };
}
