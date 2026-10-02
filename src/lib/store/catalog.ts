import "server-only";
import type { createClient } from "../supabase/server";
import type { Product, ProductPrice } from "../types";

type Client = Awaited<ReturnType<typeof createClient>>;

export type CatalogPrice = ProductPrice & { compareSatang: number | null };
export type CatalogProduct = Omit<Product, "product_prices"> & { prices: CatalogPrice[] };

const sameTerms = (a: ProductPrice, b: ProductPrice) =>
  a.billing === b.billing && a.interval === b.interval && a.duration_days === b.duration_days;

/** Active products with their active prices. Bundle prices carry what the same codes cost bought one by one. */
export async function loadCatalog(supabase: Client): Promise<CatalogProduct[]> {
  const { data } = await supabase.from("products").select("*, product_prices(*)").eq("active", true).order("sort");
  const products = ((data ?? []) as Product[]).map((p) => ({
    ...p,
    prices: (p.product_prices ?? []).filter((x) => x.active).sort((a, b) => a.sort - b.sort || a.amount_satang - b.amount_satang),
  }));
  const singles = products.filter((p) => p.kind === "single");

  return products
    .filter((p) => p.prices.length > 0)
    .map(({ product_prices: _omit, ...p }) => ({
      ...p,
      prices: p.prices.map((price) => {
        if (p.kind !== "bundle") return { ...price, compareSatang: null };
        let sum = 0;
        for (const code of p.codes) {
          const single = singles.find((s) => s.codes.length === 1 && s.codes[0] === code)?.prices.find((x) => sameTerms(x, price));
          if (!single) return { ...price, compareSatang: null };
          sum += single.amount_satang;
        }
        return { ...price, compareSatang: sum > price.amount_satang ? sum : null };
      }),
    }));
}

/** What the viewer already has: right expiry per code (null = lifetime) and products with a live subscription. */
export async function loadOwnership(supabase: Client, userId: string) {
  const [{ data: rights }, { data: subs }] = await Promise.all([
    supabase.from("indicator_rights").select("code, expires_at").eq("user_id", userId),
    supabase.from("subscriptions").select("product_id, status").eq("user_id", userId).in("status", ["active", "trialing", "past_due"]),
  ]);
  const now = Date.now();
  const access: Record<string, string | null> = {};
  for (const r of (rights ?? []) as { code: string; expires_at: string | null }[]) {
    if (!r.expires_at || new Date(r.expires_at).getTime() > now) access[r.code] = r.expires_at;
  }
  return { access, subscribed: ((subs ?? []) as { product_id: string }[]).map((s) => s.product_id) };
}
