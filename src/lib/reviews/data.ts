import "server-only";
import type { createClient } from "../supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export type Review = { indicator_code: string; user_id: string; rating: number; body: string; author_name: string; created_at: string; updated_at: string };
export type Rating = { avg: number; count: number };

/** Average stars and review count per indicator (reviews are public). */
export async function loadReviews(supabase: Client, code: string) {
  const { data } = await supabase.from("indicator_reviews").select("*").eq("indicator_code", code).order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as Review[];
}

/** Whether the signed-in viewer bought this indicator (same rule the RLS policy enforces). */
export async function viewerPurchased(supabase: Client, code: string) {
  const { data } = await supabase.rpc("has_purchased", { p_code: code });
  return data === true;
}
