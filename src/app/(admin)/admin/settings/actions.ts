"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type TvSettingsState = { error?: string; ok?: string };

const SCRIPT_RE = /^(PUB;[A-Za-z0-9]{6,64})?$/;

/**
 * Save the TradingView owner's session cookie (Admin → ตั้งค่า TradingView).
 * Stored in app_settings (service-role only, never sent to browsers); takes effect immediately.
 */
export async function saveTvSession(_: TvSettingsState, form: FormData): Promise<TvSettingsState> {
  const sessionid = String(form.get("sessionid") ?? "").trim();
  const sign = String(form.get("sessionid_sign") ?? "").trim();
  if (!sessionid) return { error: "กรุณาวางค่า sessionid" };
  if (sessionid.length < 10) return { error: "sessionid สั้นผิดปกติ ตรวจว่าคัดลอกมาครบ" };
  if (/[\s;,]/.test(sessionid) || (sign && /[\s;,]/.test(sign))) return { error: "sessionid ต้องไม่มีช่องว่างหรือเครื่องหมาย ; ," };
  const { userId: staffId } = await requireStaff();
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin.from("app_settings").upsert([
    { key: "tradingview.sessionid", value: sessionid, updated_at: now, updated_by: staffId },
    { key: "tradingview.sessionid_sign", value: sign, updated_at: now, updated_by: staffId },
  ]);
  if (error) return { error: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง" };
  await admin.from("audit_log").insert({ actor_id: staffId, action: "tv.session.update", detail: { sign_set: Boolean(sign) } });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/rights");
  return { ok: "บันทึก Session แล้ว ระบบให้สิทธิ์อัตโนมัติจะใช้ค่านี้ทันที" };
}

/**
 * Save every indicator's invite-only script ID (one form, fields named `script_<CODE>`).
 * Only changed rows are written; each change is audit-logged.
 */
export async function saveTvScripts(_: TvSettingsState, form: FormData): Promise<TvSettingsState> {
  const { supabase, userId: staffId } = await requireStaff();
  const { data } = await supabase.from("indicators").select("code, tv_script_id").eq("is_reference", false);
  const rows = ((data ?? []) as { code: string; tv_script_id: string | null }[]);
  if (!rows.length) return { error: "ไม่พบอินดิเคเตอร์" };
  const wanted = new Map<string, string | null>();
  for (const r of rows) {
    const raw = String(form.get(`script_${r.code}`) ?? "").trim();
    if (!SCRIPT_RE.test(raw)) return { error: `Script ID ของ ${r.code} ไม่ถูกต้อง ต้องเป็นแบบ PUB;xxxxxxxx` };
    wanted.set(r.code, raw || null);
  }
  const changed = rows.filter((r) => (r.tv_script_id ?? null) !== (wanted.get(r.code) ?? null));
  if (!changed.length) return { ok: "ไม่มีอะไรเปลี่ยน" };
  for (const r of changed) {
    const { error } = await supabase.from("indicators").update({ tv_script_id: wanted.get(r.code) }).eq("code", r.code);
    if (error) return { error: `บันทึก ${r.code} ไม่สำเร็จ` };
  }
  await createAdminClient().from("audit_log").insert({
    actor_id: staffId,
    action: "tv.script.update",
    detail: { changes: Object.fromEntries(changed.map((r) => [r.code, wanted.get(r.code)])) },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/indicators");
  revalidatePath("/admin/rights");
  return { ok: `บันทึก Script ID แล้ว ${changed.length} ตัว (${changed.map((r) => r.code).join(", ")})` };
}
