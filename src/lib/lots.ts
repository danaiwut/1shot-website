import "server-only";
import type { createClient } from "./supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/** First day of the Bangkok month `offset` months from now, as YYYY-MM-DD. */
export function monthStart(offset = 0) {
  const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit" }).format(new Date()).split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  return d.toISOString().slice(0, 10);
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Lots per account between [from, to). RLS limits members to their own account. */
export async function lotsByAccount(supabase: Client, from: string, to: string, accounts?: string[]) {
  let q = supabase.from("exness_lots").select("account, day, lots").gte("day", from).lt("day", to).limit(50000);
  if (accounts) q = q.in("account", accounts);
  const { data } = await q;
  const out = new Map<string, { lots: number; lastDay: string }>();
  for (const r of (data ?? []) as { account: string; day: string; lots: number }[]) {
    const cur = out.get(r.account) ?? { lots: 0, lastDay: r.day };
    out.set(r.account, { lots: cur.lots + Number(r.lots), lastDay: r.day > cur.lastDay ? r.day : cur.lastDay });
  }
  for (const [k, v] of out) out.set(k, { ...v, lots: round2(v.lots) });
  return out;
}
