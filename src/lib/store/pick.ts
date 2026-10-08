import type { Product } from "../types";

/** Raised for problems the customer can fix; the message is shown as-is. */
export class PickError extends Error {}

/** "AMD,SW" / ["AMD","SW"] → ["AMD","SW"] (upper-case, de-duplicated, only code-shaped values). */
export function parseCodes(raw: string | string[] | undefined | null): string[] {
  const list = (Array.isArray(raw) ? raw : String(raw ?? "").split(",")).map((c) => c.trim().toUpperCase());
  return [...new Set(list.filter((c) => /^[A-Z]{2,4}$/.test(c)))];
}

/**
 * The codes an order for `product` grants. Singles and bundles: their own codes. Picks: exactly
 * `pick_count` codes chosen from the pool, none of which the buyer already has for life.
 */
export function orderCodes(
  product: Pick<Product, "kind" | "codes" | "pick_count" | "name">,
  chosen: string[],
  lifetime: string[] = [],
): string[] {
  if (product.kind !== "pick") return product.codes;
  const n = product.pick_count ?? 0;
  const picked = [...new Set(chosen)];
  if (picked.length !== n) throw new PickError(`กรุณาเลือกอินดิเคเตอร์ให้ครบ ${n} ตัว`);
  const outside = picked.filter((c) => !product.codes.includes(c));
  if (outside.length) throw new PickError(`${outside.join(", ")} ไม่อยู่ในโปรโมชั่นนี้`);
  const owned = picked.filter((c) => lifetime.includes(c));
  if (owned.length) throw new PickError(`คุณมี ${owned.join(", ")} แบบตลอดชีพแล้ว เลือกตัวอื่นแทน`);
  return product.codes.filter((c) => picked.includes(c)); // pool order, stable for names and receipts
}

/** Name stored on the order and shown on the Stripe page: "โปรตุลาคม (AMD + SW)". */
export const orderName = (product: Pick<Product, "kind" | "name">, codes: string[]) =>
  product.kind === "pick" ? `${product.name} (${codes.join(" + ")})` : product.name;

/** Sum of the chosen codes' single prices — the honest "normal price" for a pick. */
export function pickCompare(parts: Record<string, number>, chosen: string[], amount: number) {
  if (!chosen.length || chosen.some((c) => !(c in parts))) return null;
  const sum = chosen.reduce((t, c) => t + parts[c], 0);
  return sum > amount ? sum : null;
}
