import "server-only";
import { serverEnv } from "./env";
import { createAdminClient } from "./supabase/admin";

/*
 * TradingView invite-only access, automated.
 *
 * TradingView has no public API for this. These are the same web endpoints the TradingView site uses when
 * the script owner manages "Manage access" by hand, called with the owner's session cookie
 * (TRADINGVIEW_SESSIONID [+ TRADINGVIEW_SESSIONID_SIGN]). They can change without notice, so every call is
 * best-effort: on failure the right simply stays in the manual queue (admin › เพิ่มสิทธิ์อินดิเคเตอร์).
 */

const TV = "https://www.tradingview.com";

export const tvConfigured = () => Boolean(serverEnv.tradingviewSessionId());

function headers(): HeadersInit {
  const sign = serverEnv.tradingviewSessionSign();
  return {
    origin: TV,
    referer: `${TV}/`,
    "content-type": "application/x-www-form-urlencoded",
    cookie: `sessionid=${serverEnv.tradingviewSessionId()}${sign ? `; sessionid_sign=${sign}` : ""}`,
  };
}

export type UsernameCheck = { ok: true; username: string } | { ok: false; reason: "not_found" | "unavailable" };

/** Does this TradingView username exist? Returns the canonical spelling. Public endpoint, no cookie needed. */
export async function checkTradingViewUser(name: string): Promise<UsernameCheck> {
  const wanted = name.trim();
  if (!/^[A-Za-z0-9_.-]{1,64}$/.test(wanted)) return { ok: false, reason: "not_found" };
  try {
    const res = await fetch(`${TV}/username_hint/?s=${encodeURIComponent(wanted)}`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { ok: false, reason: "unavailable" };
    const list = (await res.json()) as { username?: string }[];
    const hit = Array.isArray(list) ? list.find((u) => u.username?.toLowerCase() === wanted.toLowerCase()) : undefined;
    return hit?.username ? { ok: true, username: hit.username } : { ok: false, reason: "not_found" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

async function post(path: string, body: Record<string, string>) {
  const res = await fetch(`${TV}${path}`, { method: "POST", headers: headers(), body: new URLSearchParams(body), cache: "no-store", signal: AbortSignal.timeout(10000) });
  const text = await res.text();
  let status: string | undefined;
  try { status = (JSON.parse(text) as { status?: string }).status; } catch { /* not JSON */ }
  return { ok: res.ok, status, text: text.slice(0, 200) };
}

/** Give (or update) access to one script until `expires` (null = no expiry). */
export async function grantTradingView(scriptId: string, username: string, expires: string | null) {
  const body: Record<string, string> = { pine_id: scriptId, username_recip: username };
  if (expires) body.expiration = new Date(expires).toISOString();
  const added = await post("/pine_perm/add/", body);
  if (added.ok && added.status === "ok") return true;
  if (added.status === "exists") {
    if (expires) {
      const mod = await post("/pine_perm/modify_user_expiration/", body);
      return mod.ok && mod.status === "ok";
    }
    // Lifetime for someone who already has a dated grant: re-add without an expiry.
    await post("/pine_perm/remove/", { pine_id: scriptId, username_recip: username });
    const again = await post("/pine_perm/add/", body);
    return again.ok && again.status === "ok";
  }
  throw new Error(`TradingView add failed (${added.status ?? added.text})`);
}

export async function revokeTradingView(scriptId: string, username: string) {
  const r = await post("/pine_perm/remove/", { pine_id: scriptId, username_recip: username });
  return r.ok && r.status === "ok";
}

/**
 * Mirror the member's current rights for `codes` into TradingView: active → grant/extend, gone or expired → remove.
 * Never throws (called from the Stripe webhook); failures stay visible in the manual queue.
 */
export async function syncTradingViewRights(userId: string, codes: string[]) {
  if (!tvConfigured() || !codes.length) return;
  const admin = createAdminClient();
  try {
    const [{ data: profile }, { data: indicators }, { data: rights }] = await Promise.all([
      admin.from("profiles").select("tradingview_username").eq("id", userId).maybeSingle<{ tradingview_username: string | null }>(),
      admin.from("indicators").select("code, tv_script_id").in("code", codes),
      admin.from("indicator_rights").select("code, expires_at").eq("user_id", userId).in("code", codes),
    ]);
    const username = profile?.tradingview_username;
    if (!username) return;
    const now = Date.now();
    await Promise.all(((indicators ?? []) as { code: string; tv_script_id: string | null }[]).map(async (ind) => {
      if (!ind.tv_script_id) return;
      const right = ((rights ?? []) as { code: string; expires_at: string | null }[]).find((r) => r.code === ind.code);
      const active = right && (!right.expires_at || new Date(right.expires_at).getTime() > now);
      try {
        if (active) {
          if (await grantTradingView(ind.tv_script_id, username, right.expires_at)) {
            await admin.from("indicator_rights").update({ tv_synced_at: new Date().toISOString(), tv_synced_expires: right.expires_at }).eq("user_id", userId).eq("code", ind.code);
          }
        } else {
          await revokeTradingView(ind.tv_script_id, username);
        }
      } catch (e) {
        console.error(`TradingView sync ${ind.code} for ${userId}:`, e instanceof Error ? e.message : e);
      }
    }));
  } catch (e) {
    console.error("TradingView sync failed:", e instanceof Error ? e.message : e);
  }
}

/**
 * Same as syncTradingViewRights, for grants made by TradingView username to someone without an account
 * (public.tradingview_grants). Never throws.
 */
export async function syncTradingViewGrants(username: string, codes: string[]) {
  if (!tvConfigured() || !codes.length) return;
  const admin = createAdminClient();
  try {
    const [{ data: indicators }, { data: grants }] = await Promise.all([
      admin.from("indicators").select("code, tv_script_id").in("code", codes),
      admin.from("tradingview_grants").select("code, expires_at").eq("username_key", username.toLowerCase()).in("code", codes),
    ]);
    await Promise.all(((indicators ?? []) as { code: string; tv_script_id: string | null }[]).map(async (ind) => {
      const grant = ((grants ?? []) as { code: string; expires_at: string | null }[]).find((g) => g.code === ind.code);
      if (!ind.tv_script_id || !grant) return;
      try {
        if (await grantTradingView(ind.tv_script_id, username, grant.expires_at)) {
          await admin.from("tradingview_grants").update({ tv_synced_at: new Date().toISOString(), tv_synced_expires: grant.expires_at })
            .eq("username_key", username.toLowerCase()).eq("code", ind.code);
        }
      } catch (e) {
        console.error(`TradingView grant ${ind.code} for ${username}:`, e instanceof Error ? e.message : e);
      }
    }));
  } catch (e) {
    console.error("TradingView grant sync failed:", e instanceof Error ? e.message : e);
  }
}
