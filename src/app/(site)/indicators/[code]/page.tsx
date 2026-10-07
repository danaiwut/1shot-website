import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Check, ChevronRight, CreditCard, Gift, ShieldAlert } from "lucide-react";
import { RatingSummary, Stars } from "@/components/reviews/stars";
import { ReviewForm } from "@/components/reviews/review-form";
import { IndicatorCard } from "@/components/store/indicator-explorer";
import { PairPicker } from "@/components/store/pair-picker";
import { ProductCard } from "@/components/store/product-card";
import { Badge, ButtonLink, cx } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { loadIndicator, loadIndicators } from "@/lib/indicators";
import { loadRatings, loadReviews, viewerPurchased } from "@/lib/reviews/data";
import { loadCatalog, loadOwnership } from "@/lib/store/catalog";
import { indicatorOffers, offerFor, pairOffers } from "@/lib/store/offers";
import { fmtTHB, priceSuffix } from "@/lib/store/pricing";
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
  const { single, bundles, from } = offerFor(products, code);
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

  const profile = [
    ["ตลาด", "ทองคำ (XAUUSD)"],
    ["แนวทาง", ind.family],
    ["การใช้งาน", reference ? "ดูระดับราคาอ้างอิง" : `สัญญาณเข้าแบบ ${ind.modes.join(" / ")}`],
    ["สิ่งที่เห็นบนกราฟ", reference ? "ระดับ High / Low และราคาเปิด" : "จุดเข้า · จุดตัดขาดทุน · เป้าหมายราคา"],
    ["รองรับ", reference ? "TradingView และหน้าเว็บ" : "TradingView · หน้าเว็บ · Telegram"],
  ];

  return (
    <main className="min-h-dvh bg-panel-2 text-fg">
      <div className="border-b border-line bg-panel">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <nav aria-label="ตำแหน่งปัจจุบัน"><ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted"><li><Link href="/" className="hover:text-accent">หน้าแรก</Link></li><ChevronRight aria-hidden className="size-3" /><li><Link href="/#indicators" className="hover:text-accent">อินดิเคเตอร์</Link></li><ChevronRight aria-hidden className="size-3" /><li aria-current="page" className="font-medium text-fg">{ind.name}</li></ol></nav>
        </div>
      </div>

      <section className="border-b border-line bg-panel">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-14">
          <div>
            <div className="flex items-center gap-3"><span className="num grid size-12 place-items-center rounded-lg bg-brand text-sm font-bold text-white">{ind.code}</span><div><p className="text-xs font-semibold tracking-[0.12em] text-accent uppercase">{ind.family} / GOLD INDICATOR</p><p className="mt-0.5 text-xs text-muted">ผลิตภัณฑ์สำหรับ TradingView</p></div></div>
            <h1 className="mt-7 text-3xl font-semibold tracking-tight sm:text-4xl">{ind.name}</h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-muted">{ind.description}</p>
            <div className="mt-6 flex flex-wrap gap-2"><Tag>{reference ? "ข้อมูลราคาอ้างอิง" : `สัญญาณ ${ind.modes.join(" / ")}`}</Tag><Tag>XAUUSD</Tag><Tag>TradingView</Tag>{!reference && <Tag>เว็บและ Telegram</Tag>}</div>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3"><RatingSummary avg={avg} count={reviews.length} />{has && <Badge tone="buy"><BadgeCheck className="size-3.5" /> ใช้งานได้{access[code] ? ` ถึง ${fmtDate(access[code])}` : " ตลอดชีพ"}</Badge>}</div>
          </div>
          <div className="border-l-4 border-brand bg-panel-2 p-6"><p className="text-xs font-medium text-muted">{free ? "ราคา" : "ราคาเริ่มต้น"}</p><p className="num mt-2 text-3xl font-semibold">{free ? "ฟรี" : from ? fmtTHB(from.amount_satang) : "ยังไม่เปิดขาย"}</p>{from && !free && <p className="mt-1 text-sm text-muted">{priceSuffix(from)}</p>}<p className="mt-5 border-t border-line pt-4 text-sm leading-6 text-muted">{free ? "สมาชิกทุกคนสามารถเปิดดูข้อมูลอ้างอิงนี้ได้" : "เลือกแบบใช้งานที่เหมาะกับคุณ หรือดูแพ็กเกจรวมที่มี Indicator นี้"}</p>{free ? <ButtonLink href={viewer ? "/signals" : "/signup"} className="mt-5 w-full">{viewer ? "ดูสัญญาณ" : "สมัครสมาชิกฟรี"}</ButtonLink> : <ButtonLink href="#purchase" className="mt-5 w-full">{has ? "จัดการสิทธิ์ใช้งาน" : "ดูราคาและเลือกซื้อ"}<ArrowRight className="size-4" /></ButtonLink>}</div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-12">
          {ind.points.length > 0 && <section aria-labelledby="plain-title"><SectionLabel>เข้าใจในหนึ่งนาที</SectionLabel><h2 id="plain-title" className="mt-2 text-2xl font-semibold">{ind.name} ช่วยอะไรคุณ</h2><div className="mt-6 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3">{ind.points.map((point, index) => <div key={point} className="bg-panel p-5"><p className="num text-xs text-accent">0{index + 1}</p><p className="mt-3 text-sm leading-7">{point}</p></div>)}</div></section>}

          {ind.image_url && (
            <section aria-labelledby="chart-title">
              <SectionLabel>บนกราฟจริง</SectionLabel>
              <h2 id="chart-title" className="mt-2 text-2xl font-semibold">{ind.name} บน TradingView</h2>
              <figure className="mt-6 overflow-hidden rounded-card border border-line bg-panel">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded image from Supabase Storage */}
                <img src={ind.image_url} alt={`ภาพ ${ind.name} บนกราฟ TradingView`} className="w-full" />
              </figure>
            </section>
          )}

          <section aria-labelledby="profile-title"><SectionLabel>ข้อมูลผลิตภัณฑ์</SectionLabel><h2 id="profile-title" className="mt-2 text-2xl font-semibold">ข้อมูลก่อนใช้งาน</h2><dl className="mt-6 overflow-hidden rounded-card border border-line bg-panel">{profile.map(([term, value], index) => <div key={term} className={cx("grid gap-1 px-5 py-4 sm:grid-cols-[210px_1fr]", index % 2 ? "bg-panel-2" : "bg-panel")}><dt className="text-sm text-muted">{term}</dt><dd className="text-sm font-medium">{value}</dd></div>)}</dl></section>

          <section aria-labelledby="start-title"><SectionLabel>เริ่มใช้งาน</SectionLabel><h2 id="start-title" className="mt-2 text-2xl font-semibold">เริ่มได้ 3 ขั้นตอน</h2><ol className="mt-6 grid gap-4 sm:grid-cols-3">{[["สมัครสมาชิก", "สร้างบัญชีเพื่อจัดการสิทธิ์และประวัติการใช้งาน"], ["ตั้งค่า TradingView", "ใส่ชื่อผู้ใช้ในหน้าบัญชี เพื่อเปิดสิทธิ์ให้ถูกต้อง"], ["เลือกแผนใช้งาน", "ชำระเงิน แล้วดูสัญญาณผ่านช่องทางที่คุณสะดวก"]].map(([title, description], index) => <li key={title} className="border-t-2 border-brand bg-panel p-5"><p className="num text-xs text-accent">ขั้นตอน {index + 1}</p><p className="mt-3 font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-muted">{description}</p></li>)}</ol></section>

          <section aria-labelledby="faq-title"><SectionLabel>คำถามก่อนตัดสินใจ</SectionLabel><h2 id="faq-title" className="mt-2 text-2xl font-semibold">คำถามที่พบบ่อย</h2><div className="mt-6 divide-y divide-line border-y border-line">{FAQ.map(([question, answer]) => <details key={question} className="group"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-sm font-medium [&::-webkit-details-marker]:hidden">{question}<ChevronRight className="size-4 shrink-0 text-muted transition-transform group-open:rotate-90" /></summary><p className="max-w-3xl pb-5 text-sm leading-7 text-muted">{answer}</p></details>)}</div></section>
        </div>

        <aside id="purchase" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="border border-line bg-panel p-5"><p className="text-xs font-medium tracking-wider text-accent uppercase">เลือกสิทธิ์ใช้งาน</p><h2 className="mt-2 text-xl font-semibold">{free ? "เริ่มใช้งานฟรี" : has ? `สิทธิ์ใช้งาน ${ind.code}` : `ซื้อ ${ind.name}`}</h2>{free ? <><p className="mt-2 text-sm leading-6 text-muted">ข้อมูลอ้างอิงนี้เปิดให้สมาชิกทุกคน</p><ButtonLink href={viewer ? "/signals" : "/signup"} className="mt-5 w-full">{viewer ? "ดูสัญญาณ" : "สมัครสมาชิกฟรี"}</ButtonLink></> : single ? <div className="mt-5"><ProductCard product={single} access={access} subscribed={owned?.subscribed.includes(single.id)} returning={owned?.returning} from={back} variant="single" /></div> : <><p className="mt-2 text-sm leading-6 text-muted">ยังไม่มีการขายแบบรายตัว ขณะนี้เลือกใช้งานได้ผ่านแพ็กเกจรวม</p>{bundles.length > 0 && <ButtonLink href="#bundles" variant="outline" className="mt-5 w-full">ดูแพ็กเกจรวม</ButtonLink>}</>}</section>
          {pairs.length > 0 && <PairPicker code={code} pairs={pairs} from={back} open />}
          {!free && <section className="border border-line bg-panel-2 p-5"><p className="text-sm font-semibold">สิ่งที่ควรทราบ</p><ul className="mt-4 space-y-3 text-sm text-muted"><li className="flex gap-3"><CreditCard className="mt-0.5 size-4 shrink-0 text-accent" />ชำระเป็นเงินบาทผ่าน Stripe</li><li className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-accent" />สิทธิ์จะแสดงในบัญชีหลังชำระเงิน</li><li className="flex gap-3"><Gift className="mt-0.5 size-4 shrink-0 text-accent" />ขอสิทธิ์ใช้ฟรีผ่าน Exness IB ได้</li></ul></section>}
          <p className="flex gap-2 border-l-2 border-brand bg-brand-dim p-4 text-xs leading-6 text-muted"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" />การเทรดมีความเสี่ยงสูง และไม่มีผลกำไรที่รับประกัน</p>
        </aside>
      </div>

      {bundles.length > 0 && <section id="bundles" className="border-y border-line bg-panel"><div className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><SectionLabel>แพ็กเกจรวม</SectionLabel><h2 className="mt-2 text-2xl font-semibold">แพ็กเกจที่มี {ind.name}</h2><p className="mt-2 text-sm text-muted">ได้สิทธิ์ใช้งาน Indicator หลายตัวในแผนเดียว</p><div className="@container mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{bundles.map((bundle) => <ProductCard key={bundle.id} product={bundle} access={access} subscribed={owned?.subscribed.includes(bundle.id)} from={back} />)}</div></div></section>}

      <section id="reviews" className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><SectionLabel>รีวิวจากผู้ใช้</SectionLabel><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold">ประสบการณ์จากผู้ซื้อ</h2><p className="mt-2 text-sm text-muted">ผู้ที่ซื้อ Indicator นี้แล้วเท่านั้นจึงเขียนรีวิวได้</p></div><RatingSummary avg={avg} count={reviews.length} /></div><div className="mt-7 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]"><section className="border border-line bg-panel p-5">{!viewer ? <p className="text-sm text-muted"><Link href={`/login?next=${encodeURIComponent(`${back}#reviews`)}`} className="font-medium text-accent underline">เข้าสู่ระบบ</Link> เพื่อเขียนรีวิว</p> : purchased ? <><p className="mb-4 font-semibold">{mine ? "รีวิวของคุณ" : "เขียนรีวิว"}</p><ReviewForm code={code} mine={mine ? { rating: mine.rating, body: mine.body } : undefined} /></> : <p className="text-sm leading-6 text-muted">คุณจะเขียนรีวิวได้หลังซื้อ Indicator นี้แล้ว</p>}</section><div className="divide-y divide-line border-y border-line">{reviews.length ? reviews.map((review) => <article key={review.user_id} className="py-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{review.author_name}</p><p className="mt-1 flex items-center gap-1 text-xs text-buy"><BadgeCheck className="size-3" /> ผู้ซื้อจริง</p></div><div className="flex items-center gap-3"><Stars value={review.rating} /><time className="text-xs text-muted">{fmtDate(review.created_at)}</time></div></div>{review.body && <p className="mt-3 text-sm leading-7">{review.body}</p>}</article>) : <p className="py-8 text-center text-sm text-muted">ยังไม่มีรีวิวจากผู้ซื้อ</p>}</div></div></section>

      <section className="border-t border-line bg-panel-2"><div className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><div className="flex items-end justify-between gap-4"><div><SectionLabel>ผลิตภัณฑ์ที่เกี่ยวข้อง</SectionLabel><h2 className="mt-2 text-2xl font-semibold">ดู Indicator อื่น</h2></div><ButtonLink href="/#indicators" variant="outline">ดูทั้งหมด <ArrowRight className="size-4" /></ButtonLink></div><div className="mt-6 overflow-hidden rounded-card border border-line bg-panel"><ul className="divide-y divide-line">{related.map((item) => <li key={item.code}><IndicatorCard indicator={item} offer={offers.find((offer) => offer.code === item.code)} /></li>)}</ul></div></div></section>
    </main>
  );
}

function Tag({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-line-strong px-3 py-1.5 text-xs font-medium">{children}</span>; }
function SectionLabel({ children }: { children: React.ReactNode }) { return <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{children}</p>; }
