import "server-only";
import type { createClient } from "../supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export type Review = { indicator_code: string; user_id: string; rating: number; body: string; author_name: string; created_at: string; updated_at: string };
export type Rating = { avg: number; count: number };

/** Average stars and review count per indicator (reviews are public). */
export async function loadRatings(supabase: Client): Promise<Record<string, Rating>> {
  const { data } = await supabase.from("indicator_reviews").select("indicator_code, rating");
  const acc: Record<string, { sum: number; count: number }> = {};
  for (const r of (data ?? []) as { indicator_code: string; rating: number }[]) {
    acc[r.indicator_code] ??= { sum: 0, count: 0 };
    acc[r.indicator_code].sum += r.rating;
    acc[r.indicator_code].count += 1;
  }
  return Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, { avg: v.sum / v.count, count: v.count }]));
}

export async function loadReviews(supabase: Client, code: string) {
  const { data } = await supabase.from("indicator_reviews").select("*").eq("indicator_code", code).order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as Review[];
}

/** Whether the signed-in viewer bought this indicator (same rule the RLS policy enforces). */
export async function viewerPurchased(supabase: Client, code: string) {
  const { data } = await supabase.rpc("has_purchased", { p_code: code });
  return data === true;
}
