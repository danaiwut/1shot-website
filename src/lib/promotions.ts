import "server-only";
import type { createClient } from "./supabase/server";
import type { Promotion } from "./types";

type Client = Awaited<ReturnType<typeof createClient>>;

export const bangkokToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

/** The promotion running today (latest start first). Filters explicitly so staff don't see drafts on the site. */
export async function loadCurrentPromotion(supabase: Client): Promise<Promotion | null> {
  const today = bangkokToday();
  const { data } = await supabase
    .from("promotions").select("*")
    .eq("active", true).lte("starts_on", today).gte("ends_on", today)
    .order("starts_on", { ascending: false }).limit(1).maybeSingle<Promotion>();
  return data ?? null;
}
