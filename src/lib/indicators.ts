import "server-only";
import type { createClient } from "./supabase/server";
import type { Indicator } from "./types";

type Client = Awaited<ReturnType<typeof createClient>>;

export const INDICATOR_IMAGE_BUCKET = "indicator-images";

/** Public catalog entry: the DB row plus a ready-to-use image URL. */
export type PublicIndicator = Omit<Indicator, "telegram_room_id"> & { image_url: string | null };

/** Storage object key → public URL. A path starting with "/" is a file shipped in /public (seeded images). */
function imageUrl(supabase: Client, path: string | null) {
  if (!path) return null;
  if (path.startsWith("/")) return path;
  return supabase.storage.from(INDICATOR_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Only uploaded images live in Storage; static ones can't be deleted from there. */
export const isStoredImage = (path: string | null): path is string => Boolean(path && !path.startsWith("/"));

function toPublic(supabase: Client, row: Indicator): PublicIndicator {
  const { telegram_room_id: _room, ...rest } = row;
  return {
    ...rest,
    points: row.points ?? [],
    image_path: row.image_path ?? null,
    image_url: imageUrl(supabase, row.image_path),
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
