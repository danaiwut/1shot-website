/** Facebook post links and their link-preview tags. Pure helpers (no network) so they can be tested. */

const POST_HOSTS = /^([a-z0-9-]+\.)?(facebook\.com|fb\.com|fb\.watch)$/i;
const IMAGE_HOSTS = /(^|\.)(fbcdn\.net|fbsbx\.com|facebook\.com)$/i;

/** A https link to facebook.com / fb.com / fb.watch, normalised (no tracking query). */
export function facebookPostUrl(raw: string): string | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "https:" || !POST_HOSTS.test(u.hostname)) return null;
  // Keep the params that identify a post; drop tracking.
  const keep = new URLSearchParams();
  for (const k of ["story_fbid", "id", "fbid", "v", "set"]) { const v = u.searchParams.get(k); if (v) keep.set(k, v); }
  u.search = keep.toString();
  u.hash = "";
  if (u.hostname === "m.facebook.com" || u.hostname === "web.facebook.com" || u.hostname === "facebook.com") u.hostname = "www.facebook.com";
  return u.toString();
}

/** Only Facebook's own image servers are fetched when copying preview images. */
export const isFacebookImage = (raw: string) => {
  try { const u = new URL(raw); return u.protocol === "https:" && IMAGE_HOSTS.test(u.hostname); } catch { return false; }
};

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENTITIES[e.toLowerCase()] ?? m);

/** og:/twitter: meta tags of a page → title, description, images (deduplicated, in page order). */
export function parsePreview(html: string): { title: string; description: string; images: string[] } {
  const tags: { key: string; value: string }[] = [];
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    const value = /content\s*=\s*"([^"]*)"|content\s*=\s*'([^']*)'/i.exec(tag);
    if (key && value) tags.push({ key, value: decode(value[1] ?? value[2] ?? "").trim() });
  }
  const first = (...keys: string[]) => keys.map((k) => tags.find((t) => t.key === k)?.value).find(Boolean) ?? "";
  const images = [...new Set(tags.filter((t) => t.key === "og:image" || t.key === "og:image:url" || t.key === "twitter:image").map((t) => t.value))]
    .filter((src) => src.startsWith("https://"));
  return { title: first("og:title", "twitter:title"), description: first("og:description", "twitter:description", "description"), images };
}
