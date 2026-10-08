import "server-only";
import type { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import { facebookPostUrl, isFacebookImage, parsePreview } from "./facebook";
import { MAX_IMAGE, sniffImage } from "./images";

type Client = Awaited<ReturnType<typeof createClient>>;

export const BLOG_BUCKET = "blog-images";
/** Shown on every card: the 1SHOT page's name and picture. */
export const BLOG_PAGE = { name: "Jr 1Shot : ราชาลอจิก", avatar: "/images/founder-cut.png" };

export type BlogPost = { id: string; url: string; page_name: string; body: string; image_paths: string[]; posted_at: string; active: boolean };
export type PublicBlogPost = BlogPost & { images: string[] };

/** Posts newest first, with public image URLs. Visitors only ever get active ones (RLS). */
export async function loadBlogPosts(supabase: Client, limit = 20): Promise<PublicBlogPost[]> {
  const { data } = await supabase.from("blog_posts").select("*").order("posted_at", { ascending: false }).limit(limit);
  return ((data ?? []) as BlogPost[]).map((p) => ({
    ...p,
    // "/…" = a file shipped in /public; anything else is an object in the blog bucket.
    images: p.image_paths.map((path) => (path.startsWith("/") ? path : supabase.storage.from(BLOG_BUCKET).getPublicUrl(path).data.publicUrl)),
  }));
}

/**
 * Read a public Facebook post's link preview, the way Facebook's own crawler sees it.
 * Returns null when Facebook doesn't give one (private post, login wall, rate limit).
 */
export async function fetchFacebookPreview(raw: string) {
  const url = facebookPostUrl(raw);
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)", "accept-language": "th,en;q=0.8" },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 600_000);
    const p = parsePreview(html);
    if (!p.description && !p.images.length) return null;
    return { url, ...p, images: p.images.filter(isFacebookImage).slice(0, 8) };
  } catch {
    return null;
  }
}

/** Copy one image (Facebook CDN link or uploaded bytes) into the blog bucket. Returns the object path. */
export async function storeBlogImage(source: string | Uint8Array): Promise<string | null> {
  let bytes: Uint8Array;
  if (typeof source === "string") {
    if (!isFacebookImage(source)) return null;
    try {
      const res = await fetch(source, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
      if (!res.ok || !isFacebookImage(res.url || source)) return null;
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > MAX_IMAGE) return null;
      bytes = buf;
    } catch {
      return null;
    }
  } else {
    if (source.byteLength > MAX_IMAGE) return null;
    bytes = source;
  }
  const kind = sniffImage(bytes);
  if (!kind) return null;
  const path = `${crypto.randomUUID()}.${kind.ext}`;
  const { error } = await createAdminClient().storage.from(BLOG_BUCKET).upload(path, bytes, { contentType: kind.type, cacheControl: "31536000", upsert: false });
  return error ? null : path;
}

export async function removeBlogImages(paths: string[]) {
  const stored = paths.filter((p) => !p.startsWith("/"));
  if (stored.length) await createAdminClient().storage.from(BLOG_BUCKET).remove(stored);
}
