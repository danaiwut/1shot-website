import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function safeEqual(a: string, b: string) {
  if (!a || !b) return false;
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Same entropy as Python secrets.token_urlsafe(24). */
export const urlToken = () => randomBytes(24).toString("base64url");
