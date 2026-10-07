"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { RESET_COOKIE } from "@/lib/auth-reset";
import { GOOGLE_COOKIE, GOOGLE_COOKIE_MAX_AGE, googleConfigured, startGoogleFlow } from "@/lib/google-oauth";
import { publicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { isStaff, type Role } from "@/lib/types";

export type AuthState = { error?: string; message?: string; email?: string; unconfirmed?: boolean };

const safeNext = (next: FormDataEntryValue | null) => {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
};

const Email = z.email("อีเมลไม่ถูกต้อง").transform((v) => v.trim().toLowerCase());
// bcrypt (Supabase Auth) only reads the first 72 bytes.
const Password = z.string().min(10, "รหัสผ่านอย่างน้อย 10 ตัวอักษร").max(72, "รหัสผ่านยาวได้ไม่เกิน 72 ตัวอักษร");

const rateLimited = (e: { code?: string; status?: number }) => e.status === 429 || e.code?.startsWith("over_");
const RATE_MSG = "ลองหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่";

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { email, error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") return { email, unconfirmed: true, error: "ยังไม่ได้ยืนยันอีเมล ตรวจกล่องจดหมายของคุณ หรือขอลิงก์ใหม่ด้านล่าง" };
    if (rateLimited(error)) return { email, error: RATE_MSG };
    return { email, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }
  const next = form.get("next");
  if (typeof next === "string" && next) redirect(safeNext(next));
  // No destination asked for: staff land in the back office, customers in their dashboard.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle<{ role: string }>();
  redirect(profile && isStaff(profile.role as Role) ? "/admin" : "/dashboard");
}

const SignupSchema = z.object({
  display_name: z.string().trim().min(1, "กรุณากรอกชื่อ").max(60),
  email: Email,
  password: Password,
});

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = SignupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email: String(form.get("email") ?? "") };
  const { email, password, display_name } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name }, emailRedirectTo: `${publicEnv.siteUrl()}/auth/confirm?next=/account` },
  });
  if (error) {
    if (error.code === "weak_password") return { email, error: "รหัสผ่านคาดเดาง่ายเกินไป หรือเคยรั่วไหลมาก่อน กรุณาตั้งใหม่" };
    if (rateLimited(error)) return { email, error: RATE_MSG };
    // "user_already_exists" falls through to the same success message, so addresses can't be probed.
    if (error.code !== "user_already_exists") return { email, error: "สมัครไม่สำเร็จ กรุณาลองใหม่" };
  }
  // Projects with email confirmation turned off return a session straight away.
  if (data?.session) redirect("/account");
  return { email, message: `ส่งลิงก์ยืนยันไปที่ ${email} แล้ว เปิดอีเมลเพื่อเปิดใช้งานบัญชี (ถ้าไม่เห็น ลองดูในโฟลเดอร์สแปม)` };
}

export async function resendConfirmation(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = Email.safeParse(form.get("email"));
  if (!parsed.success) return { error: "อีเมลไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: `${publicEnv.siteUrl()}/auth/confirm?next=/account` },
  });
  if (error && rateLimited(error)) return { email: parsed.data, error: RATE_MSG };
  return { email: parsed.data, message: `ส่งลิงก์ยืนยันใหม่ไปที่ ${parsed.data} แล้ว` };
}

export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = Email.safeParse(form.get("email"));
  if (!parsed.success) return { error: "อีเมลไม่ถูกต้อง", email: String(form.get("email") ?? "") };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${publicEnv.siteUrl()}/auth/confirm?next=/reset-password`,
  });
  if (error && rateLimited(error)) return { email: parsed.data, error: RATE_MSG };
  // Same answer whether or not the account exists.
  return { email: parsed.data, message: `ถ้ามีบัญชีของ ${parsed.data} อยู่ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ให้แล้ว ลิงก์ใช้ได้ครั้งเดียว` };
}

const NewPassword = z.object({ password: Password, confirm: z.string() }).refine((v) => v.password === v.confirm, { message: "รหัสผ่านทั้งสองช่องไม่ตรงกัน" });

/** Step 2 of "forgot password": the reset link signed the user in; now set the new password. */
export async function setNewPassword(_: AuthState, form: FormData): Promise<AuthState> {
  const jar = await cookies();
  if (!jar.get(RESET_COOKIE)) return { error: "ลิงก์ตั้งรหัสผ่านหมดอายุแล้ว กรุณาขอลิงก์ใหม่" };
  const parsed = NewPassword.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: passwordError(error) };
  jar.delete(RESET_COOKIE);
  redirect("/dashboard?password=updated");
}

/** Account page: change password while signed in. The current password is checked first. */
export async function changePassword(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = NewPassword.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const email = claims?.claims?.email as string | undefined;
  if (!email) return { error: "กรุณาเข้าสู่ระบบใหม่" };
  const current = String(form.get("current") ?? "");
  const { error: wrong } = await supabase.auth.signInWithPassword({ email, password: current });
  if (wrong) return { error: rateLimited(wrong) ? RATE_MSG : "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: passwordError(error) };
  return { message: "เปลี่ยนรหัสผ่านแล้ว" };
}

function passwordError(e: { code?: string; status?: number }) {
  if (e.code === "same_password") return "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม";
  if (e.code === "weak_password") return "รหัสผ่านคาดเดาง่ายเกินไป หรือเคยรั่วไหลมาก่อน";
  if (rateLimited(e)) return RATE_MSG;
  return "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่";
}

/** Start Google sign-in. Google returns to our own /auth/google/callback (see lib/google-oauth). */
export async function signInWithGoogle(_: AuthState, form: FormData): Promise<AuthState> {
  if (!googleConfigured()) return { error: "ยังไม่ได้ตั้งค่าการเข้าสู่ระบบด้วย Google กรุณาใช้อีเมลแทน" };
  const next = form.get("next");
  // Return to the host the user is actually on (production domain, preview URL or localhost).
  // Google only accepts redirect URIs registered on the OAuth client, so a forged Host header goes nowhere.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const origin = host ? `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}` : publicEnv.siteUrl();
  const { url, flow } = startGoogleFlow(origin, typeof next === "string" && next ? safeNext(next) : undefined);
  (await cookies()).set(GOOGLE_COOKIE, JSON.stringify(flow), {
    httpOnly: true, secure: origin.startsWith("https://"), sameSite: "lax", path: "/auth/google", maxAge: GOOGLE_COOKIE_MAX_AGE,
  });
  redirect(url);
}
