import { ArrowRight, CandlestickChart, MonitorSmartphone, Target } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { CountUp } from "@/components/motion/hero";
import { IntroCurtain } from "@/components/motion/intro";
import { LiveHero } from "@/components/motion/live-hero";
import { VelocityMarquee } from "@/components/motion/marquee";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { AboutSection } from "@/components/site/about-section";
import { CatalogView } from "@/components/store/catalog-view";
import { IndicatorExplorer } from "@/components/store/indicator-explorer";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { loadIndicators, type PublicIndicator } from "@/lib/indicators";
import { loadRatings, type Rating } from "@/lib/reviews/data";
import { loadCatalog, loadOwnership } from "@/lib/store/catalog";
import { indicatorOffers } from "@/lib/store/offers";
import { createClient } from "@/lib/supabase/server";

// Product facts, not marketing metrics. The indicator count comes from the DB.
const stats = (indicatorCount: number) => [
  { icon: CandlestickChart, v: indicatorCount, k: "อินดิเคเตอร์ให้เลือก" },
  { icon: Target, v: 3, k: "ระดับราคาในทุก Setup" },
  { icon: MonitorSmartphone, v: 2, k: "ช่องทาง เว็บ + Telegram" },
];

/** Thai word boundaries, computed on the server so client and server render the same split. */
const words = (text: string) => [...new Intl.Segmenter("th", { granularity: "word" }).segment(text)].map((x) => x.segment);

export default async function HomePage() {
  const supabase = isSupabaseConfigured() ? await createClient() : null;
  const [indicators, products, viewer, ratings] = supabase
    ? await Promise.all([loadIndicators(supabase), loadCatalog(supabase), getViewer(), loadRatings(supabase)])
    : [[] as PublicIndicator[], [], null, {} as Record<string, Rating>];
  const owned = viewer && supabase ? await loadOwnership(supabase, viewer.userId) : undefined;
  const bundles = products.filter((p) => p.kind === "bundle");
  const offers = indicatorOffers(indicators, products, ratings, owned?.access);

  return (
    <main id="main" tabIndex={-1} className="overflow-x-clip outline-none">
      <IntroCurtain />

      {/* 1 · Live chart hero */}
      <LiveHero lines={[words("อินดิเคเตอร์ทองคำ"), words("ที่ตรวจสอบได้")]}>
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
          <Stagger as="ul" className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 backdrop-blur sm:grid-cols-3">
            {stats(indicators.length).map((s) => (
              <StaggerItem as="li" key={s.k} className="flex items-center gap-3.5 bg-black/80 px-4 py-4 sm:px-5">
                <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white"><s.icon className="size-5" strokeWidth={1.8} /></span>
                <p>
                  <span className="num block text-2xl font-semibold"><CountUp to={s.v} /></span>
                  <span className="block text-sm text-muted">{s.k}</span>
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </LiveHero>

      {/* 2 · Speed-reactive marquees (decorative) */}
      <div className="relative overflow-hidden bg-panel-2 py-10">
        <VelocityMarquee items={["จุดเข้า", "ตัดขาดทุน", "ทำกำไร", "ทองคำ", "ตรวจสอบได้", "1SHOT"]} outline className="-rotate-2 bg-black py-4 text-5xl font-black tracking-tighter text-white sm:text-7xl" />
        <VelocityMarquee items={["สาย SMC", "สาย ICT", "ซัพพลาย & ดีมานด์", "ออร์เดอร์บล็อก", "กวาดสภาพคล่อง", "AMD"]} baseSpeed={-2} className="-mt-3 rotate-1 bg-brand py-3 text-3xl font-black tracking-tighter text-white sm:text-5xl" />
      </div>

      {/* 3 · Shop: pick an indicator */}
      <section id="indicators" aria-labelledby="indicators-title" className="scroll-mt-18 bg-panel-2">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-20 sm:px-6 sm:pb-24">
          <Reveal className="mb-10 grid gap-6 md:grid-cols-2 md:items-end">
            <div>
              <p className="eyebrow">เลือกอินดิเคเตอร์</p>
              <h2 id="indicators-title" className="mt-3 text-3xl leading-tight font-bold tracking-tight sm:text-5xl">
                เครื่องมือที่เข้ากับ<br />สไตล์การเทรดของคุณ<span className="text-accent">.</span>
              </h2>
            </div>
            <p className="max-w-md text-base text-muted md:justify-self-end">
              กรองตามกลยุทธ์ อ่านรายละเอียด ดูคะแนนจากผู้ใช้จริง แล้วเลือกซื้อรายตัวหรือแพ็กเกจรวม ซื้อแล้วสิทธิ์ขึ้นในบัญชีทันที
            </p>
          </Reveal>
          <Reveal delay={0.1}><IndicatorExplorer indicators={indicators} offers={offers} /></Reveal>
        </div>
      </section>

      {/* 4 · Bundles */}
      {bundles.length > 0 && (
        <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-18 bg-panel-2">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">แพ็กเกจรวม</p>
                <h2 id="pricing-title" className="mt-3 text-3xl leading-tight font-bold tracking-tight sm:text-5xl">
                  ได้ครบกว่า จ่ายน้อยกว่า<span className="text-accent">.</span>
                </h2>
                <p className="mt-3 max-w-md text-base text-muted">จ่ายรายเดือนหรือครั้งเดียว หรือเปิดบัญชีผ่าน Exness IB เพื่อใช้ฟรี</p>
              </div>
              <ButtonLink href="/pricing" variant="outline">ดูราคาทั้งหมด <ArrowRight aria-hidden className="size-4" /></ButtonLink>
            </Reveal>
            <Reveal delay={0.1}><CatalogView products={bundles} access={owned?.access} subscribed={owned?.subscribed} from="/pricing" bundlesOnly /></Reveal>
          </div>
        </section>
      )}

      {/* 5 · About + onboarding call to action */}
      <AboutSection indicatorCount={indicators.length} actionHref={viewer ? "/dashboard" : "/signup"} actionLabel={viewer ? "ไปที่บัญชีของฉัน" : "สมัครสมาชิกฟรี"} />
    </main>
  );
}
