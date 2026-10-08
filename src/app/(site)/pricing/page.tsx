import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronDown, CreditCard, Gift, Infinity as InfinityIcon, ShieldCheck, Zap } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { PricingTable } from "@/components/store/pricing-table";
import { SingleCard } from "@/components/store/single-card";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { loadIndicators, type PublicIndicator } from "@/lib/indicators";
import { loadCurrentPromotion } from "@/lib/promotions";
import { loadCatalog, loadOwnership, type CatalogProduct } from "@/lib/store/catalog";
import { pairOffers, savingPercent } from "@/lib/store/offers";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "ราคาและแพ็กเกจ", description: "อินดิเคเตอร์ทองคำ XAUUSD บน TradingView ซื้อรายตัว ซื้อคู่ หรือรับโปรโมชั่นประจำเดือน" };

const FAQ = [
  ["ซื้อแล้วได้ใช้เมื่อไร?", "ทันทีที่ชำระเงินสำเร็จ สิทธิ์จะขึ้นในบัญชี และระบบเปิดสิทธิ์อินดิเคเตอร์ให้ชื่อผู้ใช้ TradingView ที่คุณกรอกตอนสั่งซื้อ"],
  ["ตลอดชีพหมายถึงอะไร?", "จ่ายครั้งเดียว ใช้อินดิเคเตอร์ตัวนั้นได้ต่อเนื่องโดยไม่มีค่ารายเดือน รวมถึงอัปเดตเวอร์ชันใหม่ของตัวเดิม"],
  ["ซื้อคู่หรือโปรเลือกเองต่างจากซื้อรายตัวอย่างไร?", "ได้อินดิเคเตอร์หลายตัวในราคาที่ถูกกว่าซื้อแยก ราคาขีดฆ่าคือราคารายตัวรวมกันจริง โปรเลือกเองให้คุณเลือกตัวที่ต้องการในหน้าชำระเงิน"],
  ["ชำระเงินช่องทางไหนได้บ้าง?", "บัตรเครดิต/เดบิต และ PromptPay ผ่าน Stripe ข้อมูลบัตรไม่ผ่านเว็บเรา ใบเสร็จส่งไปที่อีเมลที่กรอกไว้"],
  ["ใช้ฟรีผ่าน Exness IB ได้อย่างไร?", "เปิดบัญชี Exness ภายใต้ IB ของเรา แล้วกรอกเลขบัญชีในหน้าบัญชีของฉัน ระบบตรวจสอบและเปิดสิทธิ์ให้"],
  ["ต้องใช้ TradingView แพ็กเกจไหน?", "ใช้ได้ทุกแพ็กเกจ ยกเว้น ICT-AMD Pro และ ICT-Sweep ที่แนะนำ Premium ขึ้นไปเพื่อให้แดชบอร์ดสถิติแสดงครบ"],
];

export default async function PricingPage() {
  const supabase = isSupabaseConfigured() ? await createClient() : null;
  const [products, indicators, promotion, viewer] = supabase
    ? await Promise.all([loadCatalog(supabase), loadIndicators(supabase), loadCurrentPromotion(supabase), getViewer()])
    : [[] as CatalogProduct[], [] as PublicIndicator[], null, null];
  const owned = viewer && supabase ? await loadOwnership(supabase, viewer.userId) : undefined;

  const deals = products.filter((p) => p.kind !== "single");
  const singles = products
    .filter((p) => p.kind === "single" && p.codes.length === 1)
    .map((p) => ({ product: p, indicator: indicators.find((i) => i.code === p.codes[0]) }))
    .filter((x): x is { product: CatalogProduct; indicator: PublicIndicator } => Boolean(x.indicator))
    .sort((a, b) => a.indicator.sort - b.indicator.sort);
  const bestPair = (code: string) =>
    Math.max(0, ...pairOffers(products, code, owned?.returning).map((o) => savingPercent(o.compareSatang, o.price.amount_satang) ?? 0)) || null;
  const from = singles.length ? Math.min(...singles.map((s) => s.product.prices[0]?.amount_satang ?? Infinity)) : null;

  return (
    <main id="main" tabIndex={-1} className="overflow-x-clip outline-none">
      {/* Hero */}
      <section className="relative -mt-18 overflow-hidden border-b border-line bg-ink pt-18 text-fg">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/3 h-[480px] bg-[radial-gradient(50%_60%_at_50%_40%,rgb(178_0_22/0.12),transparent_70%)] dark:bg-[radial-gradient(50%_60%_at_50%_40%,rgb(178_0_22/0.35),transparent_70%)]" />
        <div className="relative mx-auto max-w-5xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28 sm:pb-20">
          <Reveal>
            <p className="text-sm font-bold text-accent">ราคาและแพ็กเกจ</p>
            <h1 className="mt-4 text-4xl leading-[1.08] font-black tracking-tight text-balance sm:text-6xl">
              จ่ายครั้งเดียว<br />ใช้ได้<span className="text-brand dark:text-[#ff2e43]">ตลอดชีพ</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted">
              อินดิเคเตอร์ทองคำบน TradingView ซื้อรายตัว{from ? ` เริ่มต้น ${new Intl.NumberFormat("th-TH").format(from / 100)} บาท` : ""} หรือซื้อคู่ให้คุ้มกว่า ชำระแล้วระบบเปิดสิทธิ์ให้อัตโนมัติ
            </p>
          </Reveal>
          <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line text-left shadow-[0_20px_60px_-40px_rgb(0_0_0/0.4)] sm:grid-cols-4">
            {[
              { icon: InfinityIcon, t: "ใช้ตลอดชีพ", d: "ไม่มีรายเดือน" },
              { icon: Zap, t: "ได้สิทธิ์ทันที", d: "เปิดใน TradingView ให้" },
              { icon: CreditCard, t: "บัตร / PromptPay", d: "ชำระผ่าน Stripe" },
              { icon: Gift, t: "ฟรีผ่าน IB", d: "สำหรับลูกค้า Exness" },
            ].map((f) => (
              <li key={f.t} className="flex items-center gap-3 bg-panel px-4 py-4">
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white"><f.icon className="size-5" /></span>
                <span><span className="block text-sm font-semibold">{f.t}</span><span className="block text-xs text-muted">{f.d}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Deals */}
      {deals.length > 0 && (
        <section id="deals" aria-labelledby="pricing-title" className="pricing-bg relative scroll-mt-18 overflow-hidden bg-panel-2">
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <Reveal><PricingTable products={deals} promotion={promotion} from="/pricing" /></Reveal>
          </div>
        </section>
      )}

      {/* Singles */}
      {singles.length > 0 && (
        <section id="singles" aria-labelledby="singles-title" className="scroll-mt-18 bg-panel">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
            <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-accent">ซื้อรายตัว</p>
                <h2 id="singles-title" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">เลือกเฉพาะตัวที่ใช่<span className="text-brand dark:text-[#ff2e43]">.</span></h2>
                <p className="mt-2 max-w-lg text-base text-muted">ทุกตัวใช้ได้ตลอดชีพ อยากได้หลายตัว ซื้อคู่ถูกกว่า</p>
              </div>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {singles.map(({ product, indicator }) => (
                <SingleCard
                  key={product.id}
                  product={product}
                  indicator={indicator}
                  owned={owned && indicator.code in owned.access ? owned.access[indicator.code] : undefined}
                  pairSaving={bestPair(indicator.code)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Free via IB */}
      <section className="bg-panel-2">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-3xl border border-line bg-panel px-6 py-10 text-fg sm:px-10">
            <div aria-hidden className="pointer-events-none absolute -right-20 -bottom-24 size-80 rounded-full bg-brand/15 blur-3xl dark:bg-brand/40" />
            <div className="relative max-w-xl">
              <p className="flex items-center gap-2 text-sm font-semibold text-accent"><ShieldCheck aria-hidden className="size-4" /> ทางเลือกสำหรับลูกค้า Exness</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">ใช้อินดิเคเตอร์ฟรี ผ่าน Exness IB</h2>
              <p className="mt-2 text-base text-muted">เปิดบัญชี Exness ภายใต้ IB ของเรา แล้วกรอกเลขบัญชีในหน้าบัญชีของฉัน ระบบตรวจสอบและเปิดสิทธิ์ให้</p>
            </div>
            <Link href={viewer ? "/account" : "/signup"} className="relative inline-flex h-12 items-center gap-2 rounded-lg bg-fg px-6 text-sm font-bold text-ink transition-colors hover:bg-brand hover:text-white">
              {viewer ? "กรอกเลขบัญชี Exness" : "สมัครสมาชิกฟรี"} <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="bg-panel">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="text-sm font-bold text-accent">คำถามก่อนซื้อ</p>
            <h2 id="faq-title" className="mt-3 text-3xl font-black tracking-tight">มีคำถาม?<br />เรามีคำตอบ<span className="text-brand dark:text-[#ff2e43]">.</span></h2>
            <p className="mt-3 text-base text-muted">ไม่เจอคำตอบที่หา สมัครสมาชิกแล้วส่งคำถามได้ที่เมนูช่วยเหลือ</p>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown aria-hidden className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-5 text-sm leading-7 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final call */}
      <section className="bg-brand text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-14 sm:px-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">พร้อมเทรดทองอย่างมีแผนแล้วหรือยัง?</h2>
            <p className="mt-1 flex items-center gap-2 text-white"><BadgeCheck aria-hidden className="size-4" /> ทุก Setup มี Entry, SL และ TP ตั้งแต่วินาทีแรก</p>
          </div>
          <Link href={deals.length ? "#deals" : "#singles"} className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-sm font-bold text-brand hover:bg-white/90">
            ดูโปรโมชั่นเดือนนี้ <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
