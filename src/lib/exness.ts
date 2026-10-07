import "server-only";
import { serverEnv } from "./env";
import { createAdminClient } from "./supabase/admin";

/*
 * Exness partner API → public.exness_lots (one row per trading account per day).
 *
 * Only `requestVolumes` knows the API's URL and auth. Everything else (parsing, aggregation, storage,
 * sync log, cron, admin pages) is independent of it, so plugging in the real endpoint is a one-function change.
 * The parser accepts the common field names (account/client_account/login, date/day, lots/volume_lots/volume).
 */

export type Volume = { account: string; day: string; lots: number };

export const exnessConfigured = () => Boolean(serverEnv.exnessApiUrl() && serverEnv.exnessApiToken());

const pick = (o: Record<string, unknown>, keys: string[]) => keys.map((k) => o[k]).find((v) => v !== undefined && v !== null && v !== "");

/** Normalise an API response into per-account per-day volumes (summing duplicates). */
export function parseVolumes(body: unknown): Volume[] {
  const list = Array.isArray(body) ? body
    : body && typeof body === "object"
      ? (pick(body as Record<string, unknown>, ["data", "results", "items", "rows"]) as unknown[] | undefined) ?? []
      : [];
  const sum = new Map<string, Volume>();
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const account = String(pick(r, ["account", "client_account", "account_number", "login", "client_login"]) ?? "").trim();
    const day = String(pick(r, ["day", "date", "trade_date", "close_date"]) ?? "").slice(0, 10);
    const lots = Number(pick(r, ["lots", "volume_lots", "volume", "lot"]) ?? NaN);
    if (!/^[0-9]{4,20}$/.test(account) || !/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(lots) || lots < 0) continue;
    const key = `${account}|${day}`;
    const prev = sum.get(key);
    sum.set(key, { account, day, lots: Math.round(((prev?.lots ?? 0) + lots) * 100) / 100 });
  }
  return [...sum.values()];
}

/** The only API-specific part. Adjust URL/params/auth to the Exness partner API you use. */
async function requestVolumes(from: string, to: string): Promise<unknown> {
  const url = new URL(serverEnv.exnessApiUrl());
  url.searchParams.set("date_from", from);
  url.searchParams.set("date_to", to);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${serverEnv.exnessApiToken()}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Exness API ${res.status}`);
  return res.json();
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Pull the last `days` days and upsert them. Every run is logged in exness_sync_runs. */
export async function syncExness(trigger: "cron" | "manual", days = 35): Promise<{ ok: boolean; rows: number; error?: string }> {
  const db = createAdminClient();
  const { data: run } = await db.from("exness_sync_runs").insert({ trigger }).select("id").single<{ id: number }>();
  const finish = async (ok: boolean, rows: number, error?: string) => {
    if (run) await db.from("exness_sync_runs").update({ finished_at: new Date().toISOString(), ok, rows, error: error ?? null }).eq("id", run.id);
    return { ok, rows, error };
  };
  if (!exnessConfigured()) return finish(false, 0, "ยังไม่ได้ตั้งค่า EXNESS_API_URL / EXNESS_API_TOKEN");
  try {
    const to = new Date();
    const from = new Date(to.getTime() - days * 864e5);
    const volumes = parseVolumes(await requestVolumes(ymd(from), ymd(to)));
    const syncedAt = new Date().toISOString();
    for (let i = 0; i < volumes.length; i += 500) {
      const chunk = volumes.slice(i, i + 500).map((v) => ({ ...v, synced_at: syncedAt }));
      const { error } = await db.from("exness_lots").upsert(chunk, { onConflict: "account,day" });
      if (error) throw new Error(error.message);
    }
    return finish(true, volumes.length);
  } catch (e) {
    return finish(false, 0, e instanceof Error ? e.message.slice(0, 300) : "unknown error");
  }
}
