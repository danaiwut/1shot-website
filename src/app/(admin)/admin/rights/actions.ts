"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { nextExpiry, splitTargets, type Duration } from "@/lib/rights";
import { checkTradingViewUser, syncTradingViewGrants, syncTradingViewRights } from "@/lib/tradingview";

export type GrantState = { error?: string; ok?: string; missing?: string[] };

const Schema = z.object({
  who: z.string().max(10_000),
  codes: z.array(z.string().regex(/^[A-Z]{2,4}$/)).min(1, "เลือกอินดิเคเตอร์อย่างน้อย 1 ตัว"),
  mode: z.enum(["days", "until", "lifetime"]),
  days: z.coerce.number().int().min(1).max(3650).optional(),
  until: z.string().optional(),
  note: z.string().trim().max(200).optional(),
});

type Current = { expires_at: string | null };

/**
 * Give or extend rights, by TradingView username (normal case) or email.
 *   - a username/email that belongs to a member → indicator_rights on their account
 *   - a TradingView username with no account yet → tradingview_grants; it moves onto their account
 *     automatically when they save that username (DB trigger)
 * TradingView usernames are checked against TradingView first. Everything is pushed to TradingView
 * when automation is configured; the rest shows up in the "ต้องเปิดใน TradingView" list.
 */
export async function grantRights(_: GrantState, form: FormData): Promise<GrantState> {
  const parsed = Schema.safeParse({
    who: form.get("who") ?? "", codes: form.getAll("codes"), mode: form.get("mode"),
    days: form.get("days") || undefined, until: form.get("until") || undefined, note: form.get("note") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const v = parsed.data;
  const { names, emails, invalid } = splitTargets(v.who);
  if (invalid.length) return { error: `ชื่อไม่ถูกต้อง: ${invalid.join(", ")} (ชื่อ TradingView ใช้ได้เฉพาะ A–Z 0–9 _ . -)` };
  if (!names.length && !emails.length) return { error: "กรุณาใส่ชื่อผู้ใช้ TradingView อย่างน้อย 1 ชื่อ" };
  if (names.length + emails.length > 200) return { error: "ครั้งละไม่เกิน 200 คน" };

  let duration: Duration;
  if (v.mode === "lifetime") duration = { mode: "lifetime" };
  else if (v.mode === "until") {
    if (!v.until || !/^\d{4}-\d{2}-\d{2}$/.test(v.until)) return { error: "กรุณาเลือกวันหมดอายุ" };
    duration = { mode: "until", until: new Date(`${v.until}T23:59:59+07:00`).toISOString() };
  } else {
    if (!v.days) return { error: "กรุณาใส่จำนวนวัน" };
    duration = { mode: "days", days: v.days };
  }

  // 1. TradingView usernames must exist on TradingView (canonical spelling). Unreachable → keep as typed.
  const checks = await Promise.all(names.map(async (n) => ({ typed: n, r: await checkTradingViewUser(n) })));
  const notOnTv = checks.filter((c) => !c.r.ok && c.r.reason === "not_found").map((c) => c.typed);
  const tvNames = checks.filter((c) => c.r.ok || c.r.reason !== "not_found").map((c) => (c.r.ok ? c.r.username : c.typed));

  // 2. Which of them are members?
  const { supabase, userId: staffId } = await requireStaff();
  const [byEmail, byName] = await Promise.all([
    emails.length ? supabase.from("profiles").select("id, email, tradingview_username").in("email", emails) : { data: [] },
    tvNames.length
      ? supabase.from("profiles").select("id, email, tradingview_username").or(tvNames.map((n) => `tradingview_username.ilike.${n}`).join(","))
      : { data: [] },
  ]);
  type P = { id: string; email: string; tradingview_username: string | null };
  const wanted = new Set(tvNames.map((n) => n.toLowerCase()));
  // ilike treats "_" as a wildcard, so keep exact (case-insensitive) matches only.
  const nameMembers = ((byName.data ?? []) as P[]).filter((p) => p.tradingview_username && wanted.has(p.tradingview_username.toLowerCase()));
  const members = [...new Map([...((byEmail.data ?? []) as P[]), ...nameMembers].map((p) => [p.id, p])).values()];
  const missingEmails = emails.filter((e) => !members.some((p) => p.email.toLowerCase() === e));
  const memberNames = new Set(nameMembers.map((p) => p.tradingview_username!.toLowerCase()));
  const guests = tvNames.filter((n) => !memberNames.has(n.toLowerCase()));

  // 3. Members → indicator_rights.
  let changed = 0;
  if (members.length) {
    const { data: current } = await supabase.from("indicator_rights").select("user_id, code, expires_at").in("user_id", members.map((p) => p.id)).in("code", v.codes);
    const existing = new Map(((current ?? []) as (Current & { user_id: string; code: string })[]).map((r) => [`${r.user_id}|${r.code}`, r]));
    const rows = members.flatMap((p) => v.codes.flatMap((code) => {
      const prev = existing.get(`${p.id}|${code}`);
      const expires_at = nextExpiry(duration, prev ? prev.expires_at : undefined);
      return expires_at === undefined ? [] : [{ user_id: p.id, code, expires_at, note: v.note || null, granted_by: staffId }];
    }));
    if (rows.length) {
      const { error } = await supabase.from("indicator_rights").upsert(rows);
      if (error) return { error: "บันทึกสิทธิ์ไม่สำเร็จ" };
      changed += rows.length;
    }
  }

  // 4. Not members yet → tradingview_grants (claimed when they sign up and save the username).
  if (guests.length) {
    const { data: current } = await supabase.from("tradingview_grants").select("username_key, code, expires_at").in("username_key", guests.map((n) => n.toLowerCase())).in("code", v.codes);
    const existing = new Map(((current ?? []) as (Current & { username_key: string; code: string })[]).map((r) => [`${r.username_key}|${r.code}`, r]));
    const rows = guests.flatMap((username) => v.codes.flatMap((code) => {
      const prev = existing.get(`${username.toLowerCase()}|${code}`);
      const expires_at = nextExpiry(duration, prev ? prev.expires_at : undefined);
      return expires_at === undefined ? [] : [{ username, code, expires_at, note: v.note || null, granted_by: staffId }];
    }));
    if (rows.length) {
      const { error } = await supabase.from("tradingview_grants").upsert(rows, { onConflict: "username_key,code" });
      if (error) return { error: "บันทึกสิทธิ์ไม่สำเร็จ" };
      changed += rows.length;
    }
  }

  // 5. Push to TradingView where configured.
  await Promise.all([
    ...members.map((p) => syncTradingViewRights(p.id, v.codes)),
    ...guests.map((n) => syncTradingViewGrants(n, v.codes)),
  ]);
  revalidatePath("/admin/rights");
  revalidatePath("/admin/members");
  revalidatePath("/admin");

  const people = members.length + guests.length;
  const missing = [...notOnTv.map((n) => `${n} (ไม่พบใน TradingView)`), ...missingEmails.map((e) => `${e} (ไม่มีบัญชีอีเมลนี้)`)];
  if (!people) return { error: "ไม่มีใครได้รับสิทธิ์ ตรวจชื่อด้านล่างอีกครั้ง", missing };
  return {
    ok: `ให้สิทธิ์แล้ว ${changed} รายการ แก่ ${people} คน${guests.length ? ` · ${guests.length} คนยังไม่มีบัญชีเว็บ สิทธิ์จะย้ายเข้าบัญชีเองเมื่อเขาสมัครและใส่ชื่อ TradingView นี้` : ""}`,
    missing,
  };
}

/** Staff confirm they opened a username-only grant in TradingView. */
export async function markGrantSynced(username: string, code: string) {
  const { supabase } = await requireStaff();
  const key = z.string().regex(/^[A-Za-z0-9_.-]{1,64}$/).parse(username).toLowerCase();
  const c = z.string().regex(/^[A-Z]{2,4}$/).parse(code);
  const { data } = await supabase.from("tradingview_grants").select("expires_at").eq("username_key", key).eq("code", c).maybeSingle<Current>();
  if (!data) return;
  await supabase.from("tradingview_grants").update({ tv_synced_at: new Date().toISOString(), tv_synced_expires: data.expires_at }).eq("username_key", key).eq("code", c);
  revalidatePath("/admin/rights");
}

/** Staff confirm they mirrored this right (and its current expiry) in TradingView. */
export async function markTvSynced(userId: string, code: string) {
  const { supabase } = await requireStaff();
  const id = z.uuid().parse(userId);
  const c = z.string().regex(/^[A-Z]{2,4}$/).parse(code);
  const { data } = await supabase.from("indicator_rights").select("expires_at").eq("user_id", id).eq("code", c).maybeSingle<{ expires_at: string | null }>();
  if (!data) return;
  await supabase.from("indicator_rights").update({ tv_synced_at: new Date().toISOString(), tv_synced_expires: data.expires_at }).eq("user_id", id).eq("code", c);
  revalidatePath("/admin/rights");
}
