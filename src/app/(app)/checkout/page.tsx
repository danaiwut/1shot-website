import { notFound } from "next/navigation";
import { BackLink } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { Notice } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { loadIndicators } from "@/lib/indicators";
import { loadCatalog, loadOwnership } from "@/lib/store/catalog";
import { parseCodes } from "@/lib/store/pick";
import { termLabel } from "@/lib/store/pricing";
import { CheckoutForm } from "./form";

export const metadata = { title: "ชำระเงิน" };

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const sp = await searchParams;
  const priceId = typeof sp.price === "string" ? sp.price : "";
  const from = typeof sp.from === "string" && sp.from.startsWith("/") && !sp.from.startsWith("//") ? sp.from : "/store";
  if (!/^[0-9a-f-]{36}$/i.test(priceId)) notFound();

  const { supabase, profile, userId } = await requireViewer();
  const [products, owned, indicators] = await Promise.all([loadCatalog(supabase), loadOwnership(supabase, userId), loadIndicators(supabase)]);
  const product = products.find((p) => p.prices.some((x) => x.id === priceId));
  const price = product?.prices.find((x) => x.id === priceId);
  if (!product || !price) notFound();

  const lifetime = Object.entries(owned.access).filter(([, exp]) => exp === null).map(([c]) => c);
  const pick = product.kind === "pick" ? product.pick_count ?? 1 : 0;
  const preset = parseCodes(typeof sp.codes === "string" ? sp.codes : undefined)
    .filter((c) => product.codes.includes(c) && !lifetime.includes(c)).slice(0, pick);
  const items = Object.fromEntries(product.codes.map((code) => {
    const ind = indicators.find((i) => i.code === code);
    return [code, { name: product.names[code] ?? code, image: ind?.image_url ?? null, family: ind?.family ?? "" }];
  }));

  return (
    <>
      <BackLink href={from}>กลับ</BackLink>
      <PageHeader eyebrow="ชำระเงิน" title="ยืนยันคำสั่งซื้อ" description="กรอกไม่กี่ขั้นตอน แล้วชำระผ่าน Stripe ระบบเปิดสิทธิ์ใน TradingView ให้อัตโนมัติ" />
      {product.audience === "returning" && !owned.returning && (
        <div className="mb-6"><Notice tone="error">ราคานี้สำหรับลูกค้าที่เคยซื้อแล้วเท่านั้น บัญชีนี้ยังไม่มีประวัติการซื้อ</Notice></div>
      )}
      <CheckoutForm
        priceId={price.id}
        tradingview={profile.tradingview_username ?? ""}
        account={profile.exness_account ?? ""}
        email={profile.email}
        order={{
          name: product.name,
          term: termLabel(price),
          subscription: price.billing === "subscription",
          amount: price.amount_satang,
          codes: product.codes,
          until: product.available_until ? fmtDate(product.available_until) : null,
        }}
        items={items}
        parts={price.parts}
        pick={pick ? { count: pick, chosen: preset, owned: lifetime } : undefined}
      />
    </>
  );
}
