import "server-only";
import type { createClient } from "../supabase/server";
import type { Product, ProductPrice } from "../types";

type Client = Awaited<ReturnType<typeof createClient>>;

export type CatalogPrice = ProductPrice & {
  /** What the same codes cost bought one by one (bundles; picks: the cheapest possible choice). */
  compareSatang: number | null;
  /** Single price per code with the same terms, so a pick card can total the codes actually chosen. */
  parts: Record<string, number>;
};
export type CatalogProduct = Omit<Product, "product_prices"> & {
  prices: CatalogPrice[];
  /** Display name per code in `codes`. */
  names: Record<string, string>;
};

const sameTerms = (a: ProductPrice, b: ProductPrice) =>
  a.billing === b.billing && a.interval === b.interval && a.duration_days === b.duration_days;

/** Products on sale right now (active, not past `available_until`) with their active prices. */
export async function loadCatalog(supabase: Client): Promise<CatalogProduct[]> {
  const [{ data }, { data: inds }] = await Promise.all([
    supabase.from("products").select("*, product_prices(*)").eq("active", true).order("sort"),
    supabase.from("indicators").select("code, name"),
  ]);
  const nameOf = new Map(((inds ?? []) as { code: string; name: string }[]).map((i) => [i.code, i.name]));
  const now = Date.now();
  const products = ((data ?? []) as Product[])
    .filter((p) => !p.available_until || new Date(p.available_until).getTime() > now)
    .map((p) => ({
      ...p,
      prices: (p.product_prices ?? []).filter((x) => x.active).sort((a, b) => a.sort - b.sort || a.amount_satang - b.amount_satang),
    }));
  const singles = products.filter((p) => p.kind === "single" && p.codes.length === 1);

  return products
    .filter((p) => p.prices.length > 0)
    .map(({ product_prices: _omit, ...p }) => ({
      ...p,
      names: Object.fromEntries(p.codes.map((c) => [c, nameOf.get(c) ?? c])),
      prices: p.prices.map((price) => {
        if (p.kind === "single") return { ...price, compareSatang: null, parts: {} };
        const parts: Record<string, number> = {};
        for (const code of p.codes) {
          const single = singles.find((s) => s.codes[0] === code)?.prices.find((x) => sameTerms(x, price));
          if (single) parts[code] = single.amount_satang;
        }
        const values = Object.values(parts);
        let sum: number | null = null;
        if (p.kind === "bundle" && values.length === p.codes.length) sum = values.reduce((a, b) => a + b, 0);
        if (p.kind === "pick" && p.pick_count && values.length >= p.pick_count) {
          sum = values.sort((a, b) => a - b).slice(0, p.pick_count).reduce((a, b) => a + b, 0);
        }
        return { ...price, parts, compareSatang: sum && sum > price.amount_satang ? sum : null };
      }),
    }));
}

/**
 * What the viewer already has: right expiry per code (null = lifetime), products with a live subscription,
 * and whether they count as a returning customer (a paid order or any right) for "ลูกค้าเก่า" deals.
 */
export async function loadOwnership(supabase: Client, userId: string) {
  const [{ data: rights }, { data: subs }, { count: paid }] = await Promise.all([
    supabase.from("indicator_rights").select("code, expires_at").eq("user_id", userId),
    supabase.from("subscriptions").select("product_id, status").eq("user_id", userId).in("status", ["active", "trialing", "past_due"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId).in("status", ["paid", "refunded"]),
  ]);
  const now = Date.now();
  const access: Record<string, string | null> = {};
  for (const r of (rights ?? []) as { code: string; expires_at: string | null }[]) {
    if (!r.expires_at || new Date(r.expires_at).getTime() > now) access[r.code] = r.expires_at;
  }
  return {
    access,
    subscribed: ((subs ?? []) as { product_id: string }[]).map((s) => s.product_id),
    returning: (paid ?? 0) > 0 || (rights ?? []).length > 0,
  };
}
