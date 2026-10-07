/** Shared rules for giving indicator rights (admin "ให้สิทธิ์ลูกค้า"). */

const DAY = 864e5;
const TV_NAME = /^[A-Za-z0-9_.-]{1,64}$/;

/** Split the "who" box into TradingView usernames and emails; anything else is reported back as invalid. */
export function splitTargets(raw: string) {
  const names: string[] = [], emails: string[] = [], invalid: string[] = [];
  const seen = new Set<string>();
  for (const part of raw.split(/[\s,;]+/).map((s) => s.trim().replace(/^@/, "")).filter(Boolean)) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (part.includes("@")) (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part) ? emails.push(key) : invalid.push(part));
    else (TV_NAME.test(part) ? names.push(part) : invalid.push(part));
  }
  return { names, emails, invalid };
}

export type Duration = { mode: "lifetime" } | { mode: "until"; until: string } | { mode: "days"; days: number };

/**
 * New expiry for one right. `undefined` = leave it alone (adding days to a lifetime right).
 *   days     — added on top of what's left (or from now when expired / new)
 *   until    — that moment
 *   lifetime — null
 */
export function nextExpiry(d: Duration, current: string | null | undefined, now = Date.now()): string | null | undefined {
  if (d.mode === "lifetime") return null;
  if (d.mode === "until") return d.until;
  if (current === null) return undefined;
  const base = current ? Math.max(now, new Date(current).getTime()) : now;
  return new Date(base + d.days * DAY).toISOString();
}
