import "server-only";
import { serverEnv } from "./env";
import { createAdminClient } from "./supabase/admin";

/*
 * Automatic Exness IB check: "is this trading account registered under our partner link?"
 *
 * Uses the Exness affiliates (partner) API with the partner-area login:
 *   POST {base}/api/v2/auth/                 { login, password }      → { token }
 *   POST {base}/api/partner/affiliation/     { client_account }       → { affiliation: true | false, ... }
 * Best-effort only: when the API is not configured or unreachable the account stays "รอตรวจ" for staff.
 */

export const exnessIbConfigured = () => Boolean(serverEnv.exnessPartnerLogin() && serverEnv.exnessPartnerPassword());

let cached: { token: string; until: number } | null = null;

async function token(force = false) {
  if (!force && cached && cached.until > Date.now()) return cached.token;
  const res = await fetch(`${serverEnv.exnessAffiliatesUrl()}/api/v2/auth/`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ login: serverEnv.exnessPartnerLogin(), password: serverEnv.exnessPartnerPassword() }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Exness auth ${res.status}`);
  const body = (await res.json()) as { token?: string };
  if (!body.token) throw new Error("Exness auth: no token");
  cached = { token: body.token, until: Date.now() + 50 * 60_000 };
  return body.token;
}

/** Reads `affiliation` from the API answer; null when the shape is unexpected. */
export function parseAffiliation(body: unknown): boolean | null {
  if (!body || typeof body !== "object") return null;
  const v = (body as Record<string, unknown>).affiliation;
  return typeof v === "boolean" ? v : null;
}

export type IbCheck = "yes" | "no" | "unavailable";

export async function checkExnessAffiliation(account: string): Promise<IbCheck> {
  if (!exnessIbConfigured() || !/^[0-9]{4,20}$/.test(account)) return "unavailable";
  const call = async (t: string) => fetch(`${serverEnv.exnessAffiliatesUrl()}/api/partner/affiliation/`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", authorization: `JWT ${t}` },
    body: JSON.stringify({ client_account: account }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  try {
    let res = await call(await token());
    if (res.status === 401 || res.status === 403) res = await call(await token(true));
    if (!res.ok) return "unavailable";
    const yes = parseAffiliation(await res.json());
    return yes === null ? "unavailable" : yes ? "yes" : "no";
  } catch (e) {
    console.error("Exness IB check failed:", e instanceof Error ? e.message : e);
    return "unavailable";
  }
}

/** Marks the member IB-verified when Exness confirms the account. Never un-verifies; never throws. */
export async function autoVerifyIb(userId: string, account: string | null | undefined) {
  if (!account || !exnessIbConfigured()) return;
  if ((await checkExnessAffiliation(account)) !== "yes") return;
  await createAdminClient().from("profiles").update({ ib_verified: true })
    .eq("id", userId).eq("exness_account", account).eq("ib_verified", false);
}
