import "server-only";
import type { createClient } from "./supabase/server";
import type { Indicator } from "./types";

type Client = Awaited<ReturnType<typeof createClient>>;

export const INDICATOR_IMAGE_BUCKET = "indicator-images";

/** Public catalog entry: the DB row plus a ready-to-use image URL. */
export type PublicIndicator = Omit<Indicator, "telegram_room_id"> & { image_url: string | null };

function toPublic(supabase: Client, row: Indicator): PublicIndicator {
  const { telegram_room_id: _room, ...rest } = row;
  return {
    ...rest,
    points: row.points ?? [],
    image_path: row.image_path ?? null,
    image_url: row.image_path ? supabase.storage.from(INDICATOR_IMAGE_BUCKET).getPublicUrl(row.image_path).data.publicUrl : null,
  };
}

/** Every indicator in display order. */
export async function loadIndicators(supabase: Client): Promise<PublicIndicator[]> {
  const { data } = await supabase.from("indicators").select("*").order("sort");
  return ((data ?? []) as Indicator[]).map((r) => toPublic(supabase, r));
}

export async function loadIndicator(supabase: Client, code: string): Promise<PublicIndicator | null> {
  const { data } = await supabase.from("indicators").select("*").eq("code", code).maybeSingle<Indicator>();
  return data ? toPublic(supabase, data) : null;
}
