import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Chip, FaqList, RiskNote, SectionHeading } from "@/components/brand";
import { RatingSummary, Stars } from "@/components/reviews/stars";
import { ReviewForm } from "@/components/reviews/review-form";
import { Badge, ButtonLink, cx } from "@/components/ui";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { fmtDate } from "@/lib/format";
import { loadIndicator, loadIndicators, type PublicIndicator } from "@/lib/indicators";
import { loadReviews, viewerPurchased } from "@/lib/reviews/data";
import { loadCatalog, loadOwnership, type CatalogProduct } from "@/lib/store/catalog";
import { buyOptions, offerFor, pairOffers, savingPercent } from "@/lib/store/offers";
import type { createClient } from "@/lib/supabase/server";
import { BuyConfigurator } from "./buy-configurator";
import { PricingTable } from "./pricing-table";
import { SingleCard } from "./single-card";

type Client = Awaited<ReturnType<typeof createClient>>;

const FAQ = [
  ["หลังชำระเงิน ใช้งานได้เมื่อไร?", "สิทธิ์จะแสดงในบัญชีทันทีเมื่อการชำระเงินสำเร็จ หากผ่านไป 10 นาทีแล้วยังไม่เห็นสิทธิ์ ทีมงานช่วยตรวจสอบได้จากเมนูความช่วยเหลือ"],
  ["รายเดือนและจ่ายครั้งเดียวต่างกันอย่างไร?", "รายเดือนมีการตัดเงินตามรอบและยกเลิกการต่ออายุได้ในหน้าร้านค้า ส่วนจ่ายครั้งเดียวจะได้สิทธิ์ตามระยะเวลาที่ระบุ โดยไม่มีการตัดซ้ำ"],
  ["ต้องมีประสบการณ์เทรดมากไหม?", "ไม่จำเป็นต้องเป็นมืออาชีพ แต่ควรเข้าใจความเสี่ยงและทดลองอ่านสัญญาณบนกราฟก่อนใช้งานจริง อินดิเคเตอร์เป็นเครื่องมือช่วยวิเคราะห์ ไม่ใช่การรับประกันผลกำไร"],
] as const;

/** Everything the indicator page needs; `userId` undefined = signed out. */
export async function loadIndicatorDetail(supabase: Client, code: string, userId?: string) {
  const [ind, indicators, products, reviews] = await Promise.all([
    loadIndicator(supabase, code), loadIndicators(supabase), loadCatalog(supabase), loadReviews(supabase, code),
  ]);
  if (!ind) return null;
  const [owned, purchased] = userId ? await Promise.all([loadOwnership(supabase, userId), viewerPurchased(supabase, code)]) : [undefined, false];
  return { ind, indicators, products, reviews, owned, purchased, userId };
}
export type IndicatorDetailData = NonNullable<Awaited<ReturnType<typeof loadIndicatorDetail>>>;

/**
 * One indicator: poster + buy configurator, then what it does, profile, FAQ, bundles, reviews and related
 * indicators. Rendered by the public /indicators/[code] (`shell="site"`, full-width bands) and the member
 * /store/[code] (`shell="app"`, inside the dashboard). `base` is where product links point.
 */
export function IndicatorDetail({ data, shell, base }: { data: IndicatorDetailData; shell: "site" | "app"; base: "/indicators" | "/store" }) {
  const { ind, indicators, products, reviews, owned, purchased, userId } = data;
  const code = ind.code;
  const site = shell === "site";
  const self = `${base}/${code}`;
  const access = owned?.access ?? {};
  const has = code in access;
  const free = ind.is_reference;
  const reference = ind.is_reference || ind.modes.length === 0;
  const avg = reviews.length ? reviews.reduce((t, r) => t + r.rating, 0) / reviews.length : undefined;
  const mine = userId ? reviews.find((r) => r.user_id === userId) : undefined;
  const { bundles } = offerFor(products, code);
  const { singles, pairs, perks } = free ? { singles: [], pairs: [], perks: [] } : buyOptions(products, code, owned?.returning);

  // Related: same family first, only ones sold singly so they render as store cards.
  const singleOf = (c: string) => products.find((p) => p.kind === "single" && p.codes.length === 1 && p.codes[0] === c);
  const related = [...indicators.filter((i) => i.family === ind.family), ...indicators.filter((i) => i.family !== ind.family)]
    .filter((i) => i.code !== code && singleOf(i.code))
    .slice(0, 3)
    .map((i) => ({ indicator: i, product: singleOf(i.code)! }));
  const bestPair = (c: string) =>
    Math.max(0, ...pairOffers(products, c, owned?.returning).map((o) => savingPercent(o.compareSatang, o.price.amount_satang) ?? 0)) || null;

  const profile = [
    ["ตลาด", "ทองคำ (XAUUSD)"],
    ["แนวทาง", ind.family],
    ["การใช้งาน", reference ? "ดูระดับราคาอ้างอิง" : `สัญญาณเข้าแบบ ${ind.modes.join(" / ")}`],
    ["สิ่งที่เห็นบนกราฟ", reference ? "ระดับ High / Low และราคาเปิด" : "จุดเข้า · จุดตัดขาดทุน · เป้าหมายราคา"],
    ["รองรับ", reference ? "TradingView และหน้าเว็บ" : "TradingView · หน้าเว็บ · Telegram"],
  ];

  // Site: alternating full-width bands. App: plain stacked blocks inside the dashboard.
  const Band = ({ children, tone = "panel", id, narrow }: { children: ReactNode; tone?: "panel" | "panel-2"; id?: string; narrow?: boolean }) =>
    site ? (
      <section id={id} className={cx("scroll-mt-24 border-b border-line", tone === "panel" ? "bg-panel" : "bg-panel-2")}>
        <div className={cx("mx-auto px-4 py-16 sm:px-6 sm:py-20", narrow ? "max-w-4xl" : "max-w-6xl")}>{children}</div>
      </section>
    ) : (
      <section id={id} className="scroll-mt-24">{children}</section>
    );

  return (
    <div className={cx(!site && "@container space-y-16")}>
      {/* Buy: big poster on the left (stays while you choose), configurator on the right */}
      <div className={cx(site && "border-b border-line bg-panel")}>
        <div className={cx(
          "grid gap-10",
          site ? "mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14" : "@4xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] @4xl:gap-14",
        )}>
          <div className={site ? "lg:sticky lg:top-24 lg:self-start" : "@4xl:sticky @4xl:top-24 @4xl:self-start"}>
            <figure className="surface-dark relative aspect-square overflow-hidden rounded-3xl bg-ink shadow-[0_30px_80px_-40px_rgb(178_0_22/0.55)]">
              {ind.image_url
                // eslint-disable-next-line @next/next/no-img-element -- admin-provided poster
                ? <img src={ind.image_url} alt={`${ind.name} บนกราฟ TradingView`} className="size-full object-cover" />
                : <div className="grid size-full place-items-center"><span className="num text-8xl font-black text-white/15">{code}</span></div>}
            </figure>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip>{reference ? "ข้อมูลราคาอ้างอิง" : `สัญญาณ ${ind.modes.join(" / ")}`}</Chip><Chip>XAUUSD</Chip><Chip>TradingView</Chip>{!reference && <Chip>เว็บและ Telegram</Chip>}
            </div>
          </div>

          <div>
            <SectionHeading as="h1" size="lg" eyebrow={`${ind.family} · ${code}`} title={free ? ind.name : `ซื้อ ${ind.name}`} />
            <p className="mt-3 text-lg leading-8 text-muted">{ind.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href="#reviews"><RatingSummary avg={avg} count={reviews.length} /></a>
              {has && <Badge tone="buy"><BadgeCheck className="size-3.5" /> ใช้งานได้{access[code] ? ` ถึง ${fmtDate(access[code])}` : " ตลอดชีพ"}</Badge>}
            </div>

            <div id="purchase" className="mt-10 scroll-mt-24">
              {free ? (
                <div className="rounded-2xl border border-line bg-panel-2 p-6">
                  <p className="text-2xl font-bold">ฟรีสำหรับสมาชิก</p>
                  <p className="mt-2 text-sm text-muted">ข้อมูลอ้างอิงนี้เปิดให้สมาชิกทุกคน</p>
                  <ButtonLink href={userId ? "/signals" : "/signup"} className="mt-5">{userId ? "ดูสัญญาณ" : "สมัครสมาชิกฟรี"} <ArrowRight className="size-4" /></ButtonLink>
                </div>
              ) : (
                <>
                  <BuyConfigurator code={code} name={ind.name} singles={singles} pairs={pairs} perks={perks} owned={has ? access[code] : undefined} signedIn={Boolean(userId)} from={self} />
                  <RiskNote className="mt-6" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {ind.points.length > 0 && (
        <Band tone="panel-2" narrow>
          <SectionHeading eyebrow="เข้าใจในหนึ่งนาที" title={`${ind.name} ช่วยอะไรคุณ`} size="sm" />
          <Stagger className="mt-8 grid gap-4 sm:grid-cols-3">
            {ind.points.map((point, i) => (
              <StaggerItem
                key={point}
                className="group relative overflow-hidden rounded-2xl border border-line bg-panel p-6 transition duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_24px_60px_-36px_rgb(178_0_22/0.5)]"
              >
                <span aria-hidden className="num pointer-events-none absolute -top-3 right-3 text-7xl leading-none font-black text-accent/10 transition-colors duration-300 select-none group-hover:text-accent/25">
                  0{i + 1}
                </span>
                <span aria-hidden className="block h-1 w-10 rounded-full bg-accent/70 transition-[width] duration-300 group-hover:w-16" />
                <p className="relative mt-5 text-sm leading-7">{point}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Band>
      )}

      <Band tone={ind.points.length ? "panel" : "panel-2"} narrow>
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <SectionHeading eyebrow="ข้อมูลผลิตภัณฑ์" title="ก่อนใช้งาน" size="sm" />
            <dl className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
              {profile.map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4 px-5 py-3.5"><dt className="text-sm text-muted">{k}</dt><dd className="text-right text-sm font-medium">{v}</dd></div>
              ))}
            </dl>
          </div>
          <div>
            <SectionHeading eyebrow="คำถามก่อนตัดสินใจ" title="คำถามที่พบบ่อย" size="sm" />
            <FaqList items={FAQ} className="mt-6" />
          </div>
        </div>
      </Band>

      {bundles.length > 0 && (
        <Band id="bundles" tone="panel-2">
          <SectionHeading eyebrow="แพ็กเกจรวม" title={`แพ็กเกจที่มี ${ind.name}`} description="ได้สิทธิ์ใช้งานหลายตัวในแผนเดียว คุ้มกว่าซื้อแยก" size="sm" />
          <div className="mt-12">
            <PricingTable products={bundles} promotion={null} heading={false} max={bundles.length} from={self} access={access} subscribed={owned?.subscribed} returning={owned?.returning} />
          </div>
        </Band>
      )}

      <Band id="reviews">
        <SectionHeading eyebrow="รีวิวจากผู้ใช้" title="ประสบการณ์จากผู้ซื้อ" description="เฉพาะผู้ที่ซื้อแล้วเท่านั้นจึงเขียนรีวิวได้" size="sm" action={<RatingSummary avg={avg} count={reviews.length} />} />
        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="self-start rounded-2xl border border-line bg-panel p-5 shadow-[0_20px_60px_-40px_rgb(0_0_0/0.4)]">
            {!userId ? (
              <p className="text-sm text-muted"><Link href={`/login?next=${encodeURIComponent(`${self}#reviews`)}`} className="font-medium text-accent underline">เข้าสู่ระบบ</Link> เพื่อเขียนรีวิว</p>
            ) : purchased ? (
              <><p className="mb-4 font-semibold">{mine ? "รีวิวของคุณ" : "เขียนรีวิว"}</p><ReviewForm code={code} mine={mine ? { rating: mine.rating, body: mine.body } : undefined} /></>
            ) : (
              <p className="text-sm leading-6 text-muted">คุณจะเขียนรีวิวได้หลังซื้อ {ind.name} แล้ว</p>
            )}
          </div>
          <div className="divide-y divide-line border-y border-line">
            {reviews.length ? reviews.map((r) => (
              <article key={r.user_id} className="py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="text-sm font-semibold">{r.author_name}</p><p className="mt-1 flex items-center gap-1 text-xs text-buy"><BadgeCheck className="size-3" /> ผู้ซื้อจริง</p></div>
                  <div className="flex items-center gap-3"><Stars value={r.rating} /><time className="text-xs text-muted">{fmtDate(r.created_at)}</time></div>
                </div>
                {r.body && <p className="mt-3 text-sm leading-7">{r.body}</p>}
              </article>
            )) : <p className="py-8 text-center text-sm text-muted">ยังไม่มีรีวิวจากผู้ซื้อ</p>}
          </div>
        </div>
      </Band>

      {related.length > 0 && (
        <Band tone="panel-2">
          <SectionHeading
            eyebrow="ผลิตภัณฑ์ที่เกี่ยวข้อง" title="ดูอินดิเคเตอร์อื่น" size="sm"
            action={<ButtonLink href={site ? "/pricing#singles" : "/store#singles"} variant="outline">ดูทั้งหมด <ArrowRight className="size-4" /></ButtonLink>}
          />
          <div className={cx("mt-8 grid gap-5", site ? "sm:grid-cols-2 lg:grid-cols-3" : "@2xl:grid-cols-2 @5xl:grid-cols-3")}>
            {related.map(({ indicator, product }) => (
              <RelatedCard key={indicator.code} indicator={indicator} product={product} access={access} pairSaving={bestPair(indicator.code)} base={base} />
            ))}
          </div>
        </Band>
      )}
    </div>
  );
}

function RelatedCard({ indicator, product, access, pairSaving, base }: {
  indicator: PublicIndicator; product: CatalogProduct; access: Record<string, string | null>; pairSaving: number | null; base: "/indicators" | "/store";
}) {
  return (
    <SingleCard
      product={product} indicator={indicator} pairSaving={pairSaving} base={base} from={`${base}/${indicator.code}`}
      owned={indicator.code in access ? access[indicator.code] : undefined}
    />
  );
}
