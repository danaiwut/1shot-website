import "server-only";
import { serverEnv } from "./env";
import { createAdminClient } from "./supabase/admin";

/*
 * TradingView owner's session, editable by staff in Admin → ตั้งค่า TradingView.
 * DB (app_settings) wins; env (TRADINGVIEW_SESSIONID*) is the fallback.
 * No cache on purpose: an updated cookie must take effect on the very next sync.
 */

const KEY_ID = "tradingview.sessionid";
const KEY_SIGN = "tradingview.sessionid_sign";

export type TvSessionSource = "db" | "env" | "none";
export type TvSession = { id: string; sign: string; source: TvSessionSource; updatedAt: string | null };

type Row = { key: string; value: string; updated_at: string | null };

export async function getTvSession(): Promise<TvSession> {
  try {
    const { data } = await createAdminClient().from("app_settings").select("key, value, updated_at").in("key", [KEY_ID, KEY_SIGN]);
    const rows = ((data ?? []) as Row[]);
    const id = rows.find((r) => r.key === KEY_ID)?.value.trim() ?? "";
    if (id) {
      return {
        id,
        sign: rows.find((r) => r.key === KEY_SIGN)?.value ?? "",
        source: "db",
        updatedAt: rows.find((r) => r.key === KEY_ID)?.updated_at ?? null,
      };
    }
  } catch {
    /* DB unreachable or table not migrated yet — fall through to env. */
  }
  const id = serverEnv.tradingviewSessionId();
  if (id) return { id, sign: serverEnv.tradingviewSessionSign(), source: "env", updatedAt: null };
  return { id: "", sign: "", source: "none", updatedAt: null };
}

/** True when automatic TradingView access is possible (DB value or env). */
export async function tvConfigured(): Promise<boolean> {
  return (await getTvSession()).id !== "";
}

/** Never show a secret in full: "••••••ab12". */
export function maskSecret(s: string): string {
  return s.length <= 4 ? "••••" : `••••••${s.slice(-4)}`;
}
