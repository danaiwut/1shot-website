import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, ChevronRight, ShieldAlert } from "lucide-react";
import { RatingSummary, Stars } from "@/components/reviews/stars";
import { ReviewForm } from "@/components/reviews/review-form";
import { IndicatorCard } from "@/components/store/indicator-explorer";
import { BuyConfigurator, type PairOption, type SingleOption } from "@/components/store/buy-configurator";
import { ProductCard } from "@/components/store/product-card";
import { Badge, ButtonLink, cx } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { loadIndicator, loadIndicators } from "@/lib/indicators";
import { loadRatings, loadReviews, viewerPurchased } from "@/lib/reviews/data";
import { loadCatalog, loadOwnership } from "@/lib/store/catalog";
import { indicatorOffers, offerFor, pairOffers } from "@/lib/store/offers";
import { termLabel } from "@/lib/store/pricing";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/indicators/[code]">) {
  const ind = await loadIndicator(await createClient(), (await params).code.toUpperCase());
  return ind ? { title: `${ind.name} (${ind.code}) · อินดิเคเตอร์`, description: ind.description } : { title: "ไม่พบอินดิเคเตอร์" };
}

const FAQ = [
  ["หลังชำระเงิน ใช้งานได้เมื่อไร?", "สิทธิ์จะแสดงในบัญชีทันทีเมื่อการชำระเงินสำเร็จ หากผ่านไป 10 นาทีแล้วยังไม่เห็นสิทธิ์ ทีมงานช่วยตรวจสอบได้จากเมนูความช่วยเหลือ"],
  ["รายเดือนและจ่ายครั้งเดียวต่างกันอย่างไร?", "รายเดือนมีการตัดเงินตามรอบและยกเลิกการต่ออายุได้ในหน้าการชำระเงิน ส่วนจ่ายครั้งเดียวจะได้สิทธิ์ตามระยะเวลาที่ระบุ โดยไม่มีการตัดซ้ำ"],
  ["ต้องมีประสบการณ์เทรดมากไหม?", "ไม่จำเป็นต้องเป็นมืออาชีพ แต่ควรเข้าใจความเสี่ยงและทดลองอ่านสัญญาณบนกราฟก่อนใช้งานจริง อินดิเคเตอร์เป็นเครื่องมือช่วยวิเคราะห์ ไม่ใช่การรับประกันผลกำไร"],
];

export default async function IndicatorPage({ params }: PageProps<"/indicators/[code]">) {
  const code = (await params).code.toUpperCase();
  const supabase = await createClient();
  const [ind, indicators, products, viewer, reviews, ratings] = await Promise.all([
    loadIndicator(supabase, code), loadIndicators(supabase), loadCatalog(supabase), getViewer(), loadReviews(supabase, code), loadRatings(supabase),
  ]);
  if (!ind) notFound();

  const [owned, purchased] = viewer ? await Promise.all([loadOwnership(supabase, viewer.userId), viewerPurchased(supabase, code)]) : [undefined, false];
  const { single, bundles } = offerFor(products, code);
  const access = owned?.access ?? {};
  const has = code in access;
  const free = ind.is_reference;
  const reference = ind.is_reference || ind.modes.length === 0;
  const avg = reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : undefined;
  const mine = viewer ? reviews.find((review) => review.user_id === viewer.userId) : undefined;
  const back = `/indicators/${code}`;
  const related = indicators.filter((item) => item.code !== code && item.family === ind.family).concat(indicators.filter((item) => item.code !== code && item.family !== ind.family)).slice(0, 3);
  const offers = indicatorOffers(indicators, products, ratings, owned?.access);
  const pairs = free ? [] : pairOffers(products, code, owned?.returning);

  // Configurator options. Singles: the indicator's own prices, plus "pick 1" deals that include it
  // (e.g. the returning-customer price) when the viewer may buy them.
  const singleOptions: SingleOption[] = [
    ...(single?.prices ?? []).map((p) => ({ priceId: p.id, label: termLabel(p), amount: p.amount_satang, compare: null })),
    ...products
      .filter((p) => p.kind === "pick" && p.pick_count === 1 && p.codes.includes(code) && (p.audience === "all" || owned?.returning))
      .flatMap((p) => p.prices.map((x) => ({
        priceId: x.id, label: `${termLabel(x)} · ${p.name}`, note: p.audience === "returning" ? "ราคาพิเศษสำหรับลูกค้าเก่า" : p.badge ?? undefined,
        amount: x.amount_satang, compare: x.parts[code] && x.parts[code] > x.amount_satang ? x.parts[code] : null, codes: [code],
      }))),
  ];
  const pairOptions: PairOption[] = pairs.map((o) => ({
    partner: o.partner, partnerName: o.product.names[o.partner] ?? o.partner, priceId: o.price.id,
    amount: o.price.amount_satang, compare: o.compareSatang, pick: o.product.kind === "pick",
    note: o.product.audience === "returning" ? "ราคาลูกค้าเก่า" : undefined,
  }));
  const perks = [...new Set([...(single?.features ?? []), "เปิดสิทธิ์ใน TradingView ให้อัตโนมัติ", "ห้องสัญญาณ Telegram"])];

  const profile = [
    ["ตลาด", "ทองคำ (XAUUSD)"],
    ["แนวทาง", ind.family],
    ["การใช้งาน", reference ? "ดูระดับราคาอ้างอิง" : `สัญญาณเข้าแบบ ${ind.modes.join(" / ")}`],
    ["สิ่งที่เห็นบนกราฟ", reference ? "ระดับ High / Low และราคาเปิด" : "จุดเข้า · จุดตัดขาดทุน · เป้าหมายราคา"],
    ["รองรับ", reference ? "TradingView และหน้าเว็บ" : "TradingView · หน้าเว็บ · Telegram"],
  ];

  return (
    <main className="min-h-dvh bg-panel-2 text-fg">
      <div className="-mt-18 border-b border-line bg-panel pt-18">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <nav aria-label="ตำแหน่งปัจจุบัน"><ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted"><li><Link href="/" className="hover:text-accent">หน้าแรก</Link></li><ChevronRight aria-hidden className="size-3" /><li><Link href="/#indicators" className="hover:text-accent">อินดิเคเตอร์</Link></li><ChevronRight aria-hidden className="size-3" /><li aria-current="page" className="font-medium text-fg">{ind.name}</li></ol></nav>
        </div>
      </div>

      {/* Buy: big poster on the left (stays while you choose), configurator on the right */}
      <section className="border-b border-line bg-panel">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <figure className="surface-dark relative aspect-square overflow-hidden rounded-3xl bg-ink">
              {ind.image_url
                // eslint-disable-next-line @next/next/no-img-element -- admin-provided poster
                ? <img src={ind.image_url} alt={`${ind.name} บนกราฟ TradingView`} className="size-full object-cover" />
                : <div className="grid size-full place-items-center"><span className="num text-8xl font-black text-white/15">{ind.code}</span></div>}
            </figure>
            <div className="mt-4 flex flex-wrap gap-2"><Tag>{reference ? "ข้อมูลราคาอ้างอิง" : `สัญญาณ ${ind.modes.join(" / ")}`}</Tag><Tag>XAUUSD</Tag><Tag>TradingView</Tag>{!reference && <Tag>เว็บและ Telegram</Tag>}</div>
          </div>

          <div>
            <p className="text-sm font-semibold tracking-[0.12em] text-accent uppercase">{ind.family} · {ind.code}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{free ? ind.name : `ซื้อ ${ind.name}`}</h1>
            <p className="mt-3 text-lg leading-8 text-muted">{ind.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3"><RatingSummary avg={avg} count={reviews.length} />{has && <Badge tone="buy"><BadgeCheck className="size-3.5" /> ใช้งานได้{access[code] ? ` ถึง ${fmtDate(access[code])}` : " ตลอดชีพ"}</Badge>}</div>

            <div id="purchase" className="mt-10 scroll-mt-24">
              {free ? (
                <div className="rounded-2xl border border-line bg-panel-2 p-6">
                  <p className="text-2xl font-bold">ฟรีสำหรับสมาชิก</p>
                  <p className="mt-2 text-sm text-muted">ข้อมูลอ้างอิงนี้เปิดให้สมาชิกทุกคน</p>
                  <ButtonLink href={viewer ? "/signals" : "/signup"} className="mt-5">{viewer ? "ดูสัญญาณ" : "สมัครสมาชิกฟรี"} <ArrowRight className="size-4" /></ButtonLink>
                </div>
              ) : (
                <BuyConfigurator
                  code={code} name={ind.name} singles={singleOptions} pairs={pairOptions} perks={perks}
                  owned={has ? access[code] : undefined} signedIn={Boolean(viewer)}
                />
              )}
              {!free && <p className="mt-6 flex gap-2 text-xs leading-6 text-muted"><ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />การเทรดมีความเสี่ยงสูง ผลในอดีตไม่ได้รับประกันผลในอนาคต · ชำระเป็นเงินบาทผ่าน Stripe · ขอสิทธิ์ใช้ฟรีผ่าน Exness IB ได้</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="space-y-14">
          {ind.points.length > 0 && <section aria-labelledby="plain-title"><SectionLabel>เข้าใจในหนึ่งนาที</SectionLabel><h2 id="plain-title" className="mt-2 text-2xl font-semibold">{ind.name} ช่วยอะไรคุณ</h2><div className="mt-6 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">{ind.points.map((point, index) => <div key={point} className="bg-panel p-5"><p className="num text-xs text-accent">0{index + 1}</p><p className="mt-3 text-sm leading-7">{point}</p></div>)}</div></section>}

          <section aria-labelledby="profile-title"><SectionLabel>ข้อมูลผลิตภัณฑ์</SectionLabel><h2 id="profile-title" className="mt-2 text-2xl font-semibold">ข้อมูลก่อนใช้งาน</h2><dl className="mt-6 overflow-hidden rounded-card border border-line bg-panel">{profile.map(([term, value], index) => <div key={term} className={cx("grid gap-1 px-5 py-4 sm:grid-cols-[210px_1fr]", index % 2 ? "bg-panel-2" : "bg-panel")}><dt className="text-sm text-muted">{term}</dt><dd className="text-sm font-medium">{value}</dd></div>)}</dl></section>

          <section aria-labelledby="start-title"><SectionLabel>เริ่มใช้งาน</SectionLabel><h2 id="start-title" className="mt-2 text-2xl font-semibold">เริ่มได้ 3 ขั้นตอน</h2><ol className="mt-6 grid gap-4 sm:grid-cols-3">{[["สมัครสมาชิก", "สร้างบัญชีเพื่อจัดการสิทธิ์และประวัติการใช้งาน"], ["ตั้งค่า TradingView", "ใส่ชื่อผู้ใช้ TradingView ตอนสั่งซื้อ ระบบเปิดสิทธิ์ให้"], ["เลือกแผนใช้งาน", "ชำระเงิน แล้วดูสัญญาณผ่านช่องทางที่คุณสะดวก"]].map(([title, description], index) => <li key={title} className="border-t-2 border-brand bg-panel p-5"><p className="num text-xs text-accent">ขั้นตอน {index + 1}</p><p className="mt-3 font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-muted">{description}</p></li>)}</ol></section>

          <section aria-labelledby="faq-title"><SectionLabel>คำถามก่อนตัดสินใจ</SectionLabel><h2 id="faq-title" className="mt-2 text-2xl font-semibold">คำถามที่พบบ่อย</h2><div className="mt-6 divide-y divide-line border-y border-line">{FAQ.map(([question, answer]) => <details key={question} className="group"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-medium [&::-webkit-details-marker]:hidden">{question}<ChevronRight className="size-4 shrink-0 text-muted transition-transform group-open:rotate-90" /></summary><p className="max-w-3xl pb-5 text-sm leading-7 text-muted">{answer}</p></details>)}</div></section>
        </div>
      </div>

      {bundles.length > 0 && <section id="bundles" className="border-y border-line bg-panel"><div className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><SectionLabel>แพ็กเกจรวม</SectionLabel><h2 className="mt-2 text-2xl font-semibold">แพ็กเกจที่มี {ind.name}</h2><p className="mt-2 text-sm text-muted">ได้สิทธิ์ใช้งาน Indicator หลายตัวในแผนเดียว</p><div className="@container mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{bundles.map((bundle) => <ProductCard key={bundle.id} product={bundle} access={access} subscribed={owned?.subscribed.includes(bundle.id)} from={back} />)}</div></div></section>}

      <section id="reviews" className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><SectionLabel>รีวิวจากผู้ใช้</SectionLabel><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold">ประสบการณ์จากผู้ซื้อ</h2><p className="mt-2 text-sm text-muted">ผู้ที่ซื้อ Indicator นี้แล้วเท่านั้นจึงเขียนรีวิวได้</p></div><RatingSummary avg={avg} count={reviews.length} /></div><div className="mt-7 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]"><section className="border border-line bg-panel p-5">{!viewer ? <p className="text-sm text-muted"><Link href={`/login?next=${encodeURIComponent(`${back}#reviews`)}`} className="font-medium text-accent underline">เข้าสู่ระบบ</Link> เพื่อเขียนรีวิว</p> : purchased ? <><p className="mb-4 font-semibold">{mine ? "รีวิวของคุณ" : "เขียนรีวิว"}</p><ReviewForm code={code} mine={mine ? { rating: mine.rating, body: mine.body } : undefined} /></> : <p className="text-sm leading-6 text-muted">คุณจะเขียนรีวิวได้หลังซื้อ Indicator นี้แล้ว</p>}</section><div className="divide-y divide-line border-y border-line">{reviews.length ? reviews.map((review) => <article key={review.user_id} className="py-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{review.author_name}</p><p className="mt-1 flex items-center gap-1 text-xs text-buy"><BadgeCheck className="size-3" /> ผู้ซื้อจริง</p></div><div className="flex items-center gap-3"><Stars value={review.rating} /><time className="text-xs text-muted">{fmtDate(review.created_at)}</time></div></div>{review.body && <p className="mt-3 text-sm leading-7">{review.body}</p>}</article>) : <p className="py-8 text-center text-sm text-muted">ยังไม่มีรีวิวจากผู้ซื้อ</p>}</div></div></section>

      <section className="border-t border-line bg-panel-2"><div className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><div className="flex items-end justify-between gap-4"><div><SectionLabel>ผลิตภัณฑ์ที่เกี่ยวข้อง</SectionLabel><h2 className="mt-2 text-2xl font-semibold">ดู Indicator อื่น</h2></div><ButtonLink href="/#indicators" variant="outline">ดูทั้งหมด <ArrowRight className="size-4" /></ButtonLink></div><div className="mt-6 overflow-hidden rounded-card border border-line bg-panel"><ul className="divide-y divide-line">{related.map((item) => <li key={item.code}><IndicatorCard indicator={item} offer={offers.find((offer) => offer.code === item.code)} /></li>)}</ul></div></div></section>
    </main>
  );
}

function Tag({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-line-strong px-3 py-1.5 text-xs font-medium">{children}</span>; }
function SectionLabel({ children }: { children: React.ReactNode }) { return <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{children}</p>; }
