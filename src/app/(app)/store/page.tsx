import { CreditCard, Gift, Infinity as InfinityIcon, Zap } from "lucide-react";
import { FactStrip, SectionHeading } from "@/components/brand";
import { PageHeader } from "@/components/app/page-header";
import { PricingTable } from "@/components/store/pricing-table";
import { SingleCard } from "@/components/store/single-card";
import { ButtonLink, Notice } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { loadIndicators } from "@/lib/indicators";
import { loadCurrentPromotion } from "@/lib/promotions";
import { loadCatalog, loadOwnership, type CatalogProduct } from "@/lib/store/catalog";
import { pairOffers, savingPercent } from "@/lib/store/offers";
import { PurchaseHistory } from "./history";

export const metadata = { title: "ร้านค้า" };

const FACTS = [
  { icon: InfinityIcon, t: "ใช้ตลอดชีพ", d: "ไม่มีรายเดือน" },
  { icon: Zap, t: "ได้สิทธิ์ทันที", d: "เปิดใน TradingView ให้" },
  { icon: CreditCard, t: "บัตร / PromptPay", d: "ชำระผ่าน Stripe" },
  { icon: Gift, t: "ฟรีผ่าน IB", d: "สำหรับลูกค้า Exness" },
];

/** Member store: same deals and single cards as /pricing, plus the viewer's purchase history. */
export default async function StorePage({ searchParams }: PageProps<"/store">) {
  const { canceled } = await searchParams;
  const { supabase, userId } = await requireViewer();
  const [products, owned, indicators, promotion] = await Promise.all([
    loadCatalog(supabase), loadOwnership(supabase, userId), loadIndicators(supabase), loadCurrentPromotion(supabase),
  ]);

  const deals = products.filter((p) => p.kind !== "single");
  const singles = products
    .filter((p) => p.kind === "single" && p.codes.length === 1)
    .map((p) => ({ product: p, indicator: indicators.find((i) => i.code === p.codes[0]) }))
    .filter((x): x is { product: CatalogProduct; indicator: NonNullable<typeof x.indicator> } => Boolean(x.indicator))
    .sort((a, b) => a.indicator.sort - b.indicator.sort);
  const bestPair = (code: string) =>
    Math.max(0, ...pairOffers(products, code, owned.returning).map((o) => savingPercent(o.compareSatang, o.price.amount_satang) ?? 0)) || null;

  return (
    <>
      <PageHeader
        eyebrow="1SHOT Store"
        title="ร้านค้า"
        description="จ่ายครั้งเดียว ใช้ได้ตลอดชีพ ซื้อซ้ำจะบวกเวลาต่อจากสิทธิ์เดิม"
        action={<ButtonLink href="#history" variant="outline">ประวัติการซื้อ</ButtonLink>}
      />

      <div className="@container space-y-16">
        {canceled && <Notice>ยกเลิกการชำระเงินแล้ว ยังไม่มีการตัดเงิน</Notice>}

        <FactStrip items={FACTS} />

        {deals.length > 0 && (
          <section id="deals" aria-labelledby="pricing-title" className="pricing-bg relative scroll-mt-24 overflow-hidden rounded-3xl border border-line bg-panel px-4 py-14 sm:px-8 sm:py-16">
            <PricingTable
              products={deals} promotion={promotion} from="/store" max={deals.length}
              access={owned.access} subscribed={owned.subscribed} returning={owned.returning}
            />
          </section>
        )}

        {singles.length > 0 && (
          <section id="singles" aria-labelledby="singles-title" className="scroll-mt-24">
            <SectionHeading id="singles-title" eyebrow="ซื้อรายตัว" title="เลือกเฉพาะตัวที่ใช่" description="ทุกตัวใช้ได้ตลอดชีพ อยากได้หลายตัว ซื้อคู่ถูกกว่า" />
            <div className="mt-10 grid gap-5 @2xl:grid-cols-2 @5xl:grid-cols-3">
              {singles.map(({ product, indicator }) => (
                <SingleCard
                  key={product.id}
                  product={product}
                  indicator={indicator}
                  owned={indicator.code in owned.access ? owned.access[indicator.code] : undefined}
                  pairSaving={bestPair(indicator.code)}
                  base="/store"
                  from="/store"
                />
              ))}
            </div>
          </section>
        )}

        <PurchaseHistory supabase={supabase} userId={userId} />
      </div>
    </>
  );
}
