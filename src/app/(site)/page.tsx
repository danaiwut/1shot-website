import { ArrowRight, CandlestickChart, Clock3, MonitorSmartphone, Target } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { CountUp } from "@/components/motion/hero";
import { IntroCurtain } from "@/components/motion/intro";
import { LiveHero } from "@/components/motion/live-hero";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { AboutSection } from "@/components/site/about-section";
import { IndicatorShowcase } from "@/components/store/indicator-showcase";
import { PricingTable } from "@/components/store/pricing-table";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { loadIndicators, type PublicIndicator } from "@/lib/indicators";
import { loadCurrentPromotion } from "@/lib/promotions";
import { loadRatings, type Rating } from "@/lib/reviews/data";
import { loadCatalog, loadOwnership } from "@/lib/store/catalog";
import { indicatorOffers } from "@/lib/store/offers";
import { createClient } from "@/lib/supabase/server";

// Product facts shown under the hero. The indicator count comes from the DB.
const stats = (indicatorCount: number) => [
  { icon: CandlestickChart, n: indicatorCount, text: `${indicatorCount}+`, suffix: "+", k: "TRADING SYSTEMS", d: "เครื่องมือสำหรับหลายสไตล์" },
  { icon: Target, n: 4, text: "4", k: "SETUP DATA", d: "Entry • SL • TP • Risk" },
  { icon: MonitorSmartphone, n: 2, text: "2", k: "LIVE CHANNELS", d: "Web • Telegram" },
  { icon: Clock3, n: null, text: "24/7", k: "SYSTEM ACCESS", d: "เข้าถึงข้อมูลได้ทุกเวลา" },
];

/** Thai word boundaries, computed on the server so client and server render the same split. */
const words = (text: string) => [...new Intl.Segmenter("th", { granularity: "word" }).segment(text)].map((x) => x.segment);

export default async function HomePage() {
  const supabase = isSupabaseConfigured() ? await createClient() : null;
  const [indicators, products, viewer, ratings, promotion] = supabase
    ? await Promise.all([loadIndicators(supabase), loadCatalog(supabase), getViewer(), loadRatings(supabase), loadCurrentPromotion(supabase)])
    : [[] as PublicIndicator[], [], null, {} as Record<string, Rating>, null];
  const owned = viewer && supabase ? await loadOwnership(supabase, viewer.userId) : undefined;
  const bundles = products.filter((p) => p.kind !== "single");
  const offers = indicatorOffers(indicators, products, ratings, owned?.access);

  return (
    <main id="main" tabIndex={-1} className="overflow-x-clip outline-none">
      <IntroCurtain />

      {/* 1 · Live chart hero */}
      <LiveHero
        lines={[
          "ทุก Setup ต้องมีเหตุผล",
          "เทรดด้วยโครงสร้าง",
          "ไม่ใช่ความรู้สึก",
        ]}
        redLine="EVERY SETUP. VERIFIED."
        description="ระบบวิเคราะห์จาก 1SHOT ที่ออกแบบทุก Setup ให้มีแผนชัดเจน ตั้งแต่ Entry, Stop Loss, Take Profit ไปจนถึง Risk Management พร้อมข้อมูลสำหรับติดตามและทบทวนการเทรดอย่างเป็นระบบ"
      >
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
          <Stagger as="ul" className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line backdrop-blur lg:grid-cols-4">
            {stats(indicators.length).map((s) => (
              <StaggerItem as="li" key={s.k} className="flex items-start gap-3.5 bg-panel/90 px-4 py-5 sm:px-5">
                <span aria-hidden className="mt-1 grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white"><s.icon className="size-5" strokeWidth={1.8} /></span>
                <p className="min-w-0">
                  <span className="sr-only">{s.text} {s.k} {s.d}</span>
                  <span aria-hidden className="num block text-3xl leading-none font-bold sm:text-4xl">
                    {s.n === null ? s.text : <><CountUp to={s.n} />{s.suffix}</>}
                  </span>
                  <span aria-hidden className="mt-2 block text-xs font-semibold tracking-[0.14em] text-fg">{s.k}</span>
                  <span aria-hidden className="mt-0.5 block text-sm text-muted">{s.d}</span>
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </LiveHero>

      {/* 3 · Shop: pick an indicator */}
      <IndicatorShowcase
        headline={[words("แม่นยำ ชัดเจน และ"), words("ตรวจสอบได้ ในทุกจังหวะ"), words("ของทองคำ")]}
        indicators={indicators}
        offers={offers}
      />

      {/* 4 · Packages and this month's promotion */}
      {bundles.length > 0 && (
        <section id="pricing" aria-labelledby="pricing-title" className="pricing-bg relative scroll-mt-18 overflow-hidden bg-panel-2">
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <Reveal><PricingTable products={bundles} promotion={promotion} /></Reveal>
            <p className="mt-14 text-center">
              <ButtonLink href="/pricing" variant="outline">ดูราคาทั้งหมด รวมรายตัว <ArrowRight aria-hidden className="size-4" /></ButtonLink>
            </p>
          </div>
        </section>
      )}

      {/* 5 · About + onboarding call to action */}
      <AboutSection indicatorCount={indicators.length || undefined} actionHref={viewer ? "/dashboard" : "/signup"} actionLabel={viewer ? "ไปที่บัญชีของฉัน" : "สมัครสมาชิกฟรี"} />
    </main>
  );
}
