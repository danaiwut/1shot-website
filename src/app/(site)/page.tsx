import {
  ArrowRight, ArrowUpRight, BellRing, Bot, CandlestickChart, Clock3, Layers, LineChart, MonitorSmartphone, Rocket,
  Send, ShieldCheck, Target, Wallet,
} from "lucide-react";
import Link from "next/link";
import { Badge, ButtonLink } from "@/components/ui";
import { PriceLadder } from "@/components/signals/price-ladder";
import { CursorRing } from "@/components/motion/cursor";
import { CountUp, Depth, HeroFade, HeroHeadline, PriceTicker, Spotlight, TiltStage } from "@/components/motion/hero";
import { IntroCurtain } from "@/components/motion/intro";
import { Magnetic } from "@/components/motion/magnetic";
import { VelocityMarquee } from "@/components/motion/marquee";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { MotionRoot } from "@/components/motion/root";
import { ScrollPipeline } from "@/components/motion/scroll-pipeline";
import { SpotlightCard } from "@/components/motion/spotlight-card";
import { AboutSection } from "@/components/site/about-section";
import { CatalogView } from "@/components/store/catalog-view";
import { getViewer } from "@/lib/auth";
import { CATALOG } from "@/lib/domain/catalog";
import { hasBackend } from "@/lib/env";
import { loadCatalog, loadOwnership } from "@/lib/store/catalog";
import { createClient } from "@/lib/supabase/server";

// Every figure below is a property of the product, not a marketing metric.
const STATS = [
  { icon: CandlestickChart, v: CATALOG.length, k: "อินดิเคเตอร์" },
  { icon: Target, v: 3, k: "ระดับราคาทุก Setup" },
  { icon: MonitorSmartphone, v: 2, k: "ช่องทาง เว็บ + Telegram" },
  { icon: Bot, v: 0, k: "AI แก้ตัวเลข" },
];

const INTEGRATIONS = [
  { icon: LineChart, name: "TradingView" },
  { icon: Wallet, name: "Exness" },
  { icon: MonitorSmartphone, name: "MetaTrader 5" },
  { icon: Send, name: "Telegram" },
];

const words = (text: string) => [...new Intl.Segmenter("th", { granularity: "word" }).segment(text)].map((x) => x.segment);

const GUARDS = [
  { icon: Clock3, k: "00:00–04:59", tag: "ช่วงเวลา", title: "งดเปิดออเดอร์ช่วงตลาดบาง", v: "ไม่เปิดออเดอร์ใหม่ (เวลาไทย) และยกเลิกคำสั่งที่ค้างอยู่" },
  { icon: ShieldCheck, k: "Daily loss", tag: "ความเสี่ยงรวม", title: "ประเมินก่อนเข้าทุกครั้ง", v: "ถ้าไม่มี SL หรืออ่านข้อมูลโบรกเกอร์ไม่ได้ ระบบจะไม่เข้า" },
  { icon: Layers, k: "3.00 USD", tag: "ระยะห่าง", title: "กันเข้าซ้อนจุดเดียว", v: "XAU ต้องห่างจากออเดอร์เดิมอย่างน้อย 3.00 ถึงจะเปิดใหม่ได้" },
  { icon: BellRing, k: "SL ↓ เท่านั้น", tag: "ปรับ Stop", title: "ขยับเฉพาะทิศลดความเสี่ยง", v: "Setup ใหม่ปรับ SL ได้แต่ไม่แตะ TP และ Lot เดิม" },
];

const SAMPLE_LIST = [
  { code: "SD", name: "Supply and Demand", side: "SELL", status: "รอเข้า" },
  { code: "OB", name: "Orderblock", side: "BUY", status: "เข้าแล้ว" },
  { code: "SW", name: "Sweep Model", side: "BUY", status: "ถึง TP" },
];

export default async function HomePage() {
  const supabase = hasBackend() ? await createClient() : null;
  const [products, viewer] = supabase ? await Promise.all([loadCatalog(supabase), getViewer()]) : [[], null];
  const owned = viewer && supabase ? await loadOwnership(supabase, viewer.userId) : undefined;
  const bundles = products.filter((p) => p.kind === "bundle");
  return (
    <MotionRoot>
    <main className="overflow-x-clip">
      <IntroCurtain />
      <CursorRing />
      {/* Hero */}
      <section className="surface-dark relative -mt-18 overflow-hidden bg-ink pt-18">
        <div className="brand-glow pointer-events-none absolute inset-0 opacity-60" />
        <Spotlight />
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_20%,black_10%,transparent_65%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-16 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <div className="space-y-7">
            <HeroFade delay={0.1}>
              <p className="eyebrow flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-buy text-buy animate-pulse-dot" /> XAUUSD · สัญญาณทองคำ
              </p>
            </HeroFade>
            <HeroHeadline
              lines={[words("สัญญาณทองคำ"), words("ที่ตรวจสอบได้")]}
              accent={words("ทุกจุด")}
              className="text-[2.6rem] leading-[1.1] font-bold tracking-tight sm:text-6xl lg:text-[4.1rem]"
            />
            <HeroFade delay={1.3} className="space-y-7">
            <p className="max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              รับ Setup จากอินดิเคเตอร์ 1SHOT ตรงจาก TradingView ทุก Setup มี Entry, SL และ TP ตั้งแต่ตอนเกิดสัญญาณ
              แล้วติดตามได้จนปิดบนเว็บและใน Telegram
            </p>
            <div className="flex flex-wrap gap-3">
              <Magnetic><ButtonLink href="/pricing" className="h-12 px-6">
                ดูแพ็กเกจ <ArrowRight className="size-4" />
              </ButtonLink></Magnetic>
              <Magnetic><ButtonLink href="#how" variant="outline" className="h-12 px-6">
                ดูการทำงาน <ArrowRight className="size-4" />
              </ButtonLink></Magnetic>
            </div>
            </HeroFade>
          </div>

          <HeroVisual />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <Stagger className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {STATS.map((s) => (
              <StaggerItem key={s.k} className="flex items-center gap-3.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white">
                  <s.icon className="size-5" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="num text-2xl font-semibold"><CountUp to={s.v} /></p>
                  <p className="text-xs text-muted">{s.k}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Integrations + velocity marquee */}
      <section className="relative overflow-hidden border-b border-line bg-panel-2">
        <div className="mx-auto max-w-6xl px-4 pt-9 sm:px-6">
          <p className="text-center text-[11px] font-semibold tracking-[0.18em] text-faint uppercase">ทำงานร่วมกับเครื่องมือที่คุณใช้อยู่</p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-muted">
            {INTEGRATIONS.map((i) => (
              <li key={i.name} className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <i.icon className="size-5" strokeWidth={2} /> {i.name}
              </li>
            ))}
          </ul>
        </div>
        <VelocityMarquee
          items={["ENTRY", "STOP LOSS", "TAKE PROFIT", "XAUUSD", "VERIFIED", "1SHOT"]}
          outline
          className="mt-8 -rotate-2 bg-black py-4 text-5xl font-black tracking-tighter text-white sm:text-7xl"
        />
        <VelocityMarquee
          items={["SMC", "ICT", "SUPPLY & DEMAND", "ORDERBLOCK", "SWEEP", "AMD"]}
          baseSpeed={-2}
          className="-mt-3 mb-8 rotate-1 bg-brand py-3 text-3xl font-black tracking-tighter text-white/90 sm:text-5xl"
        />
      </section>

      {/* Indicators */}
      <section id="indicators" className="scroll-mt-18">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal><SectionHead
            eyebrow="Indicators"
            title={<>อินดิเคเตอร์ 10 ตัว<br />ในที่เดียว<span className="text-accent">.</span></>}
            aside="สิทธิ์แยกตามอินดิเคเตอร์ เลือกดูเฉพาะตัวที่คุณถือสิทธิ์ใน TradingView ทุกตัวส่งสัญญาณผ่านมาตรฐาน WF1 เดียวกัน"
          /></Reveal>
          <Stagger className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {CATALOG.map((ind) => (
              <StaggerItem key={ind.code} className="h-full">
              <SpotlightCard
                href="/pricing"
                className="border border-line bg-panel p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
              >
                <span className="num grid size-11 place-items-center rounded-xl bg-brand-dim text-sm font-bold text-accent transition-colors group-hover:bg-brand group-hover:text-white">
                  {ind.code}
                </span>
                <p className="mt-4 text-sm font-semibold sm:text-base">{ind.name}</p>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted">{ind.description}</p>
                <span className="mt-4 flex flex-wrap items-center justify-between gap-1 text-xs">
                  <span className="font-medium text-accent">ดูแพ็กเกจ →</span>
                  <span className="tracking-wider text-faint uppercase">{ind.family}</span>
                </span>
              </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Risk guard */}
      <section id="guard" className="scroll-mt-18 border-t border-line bg-panel-2">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              <p className="eyebrow">Risk guard</p>
              <h2 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                กติกาความเสี่ยง<br />ที่ทำงานก่อนทุกออเดอร์<span className="text-accent">.</span>
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              สำหรับบัญชี MT5 ที่เชื่อมระบบเทรดอัตโนมัติ Worker จะตรวจกติกาเหล่านี้ทุกครั้งก่อนส่งคำสั่ง ถ้าเช็กไม่ได้ครบ ระบบจะไม่เข้าออเดอร์
            </p>
          </Reveal>
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GUARDS.map((g, i) => (
              <StaggerItem key={g.k} className="h-full">
              <article className="h-full overflow-hidden rounded-card border border-line bg-panel transition-transform duration-500 hover:-translate-y-1">
                <div className="surface-dark relative h-40 overflow-hidden bg-ink p-5">
                  <div className={`pointer-events-none absolute -right-10 -bottom-16 size-48 rounded-full blur-3xl ${i % 2 ? "bg-brand/45" : "bg-brand/30"}`} />
                  <g.icon className="relative size-5 text-accent" strokeWidth={1.8} />
                  <p className="num relative mt-9 text-2xl font-semibold">{g.k}</p>
                </div>
                <div className="p-5">
                  <p className="text-[11px] text-faint">{g.tag}</p>
                  <p className="mt-1 font-semibold">{g.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{g.v}</p>
                </div>
              </article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <ScrollPipeline />

      {bundles.length > 0 && (
        <section id="pricing" className="scroll-mt-18 border-t border-line bg-panel-2">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div className="space-y-3">
                <p className="eyebrow">Pricing</p>
                <h2 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                  แพ็กเกจแนะนำ<span className="text-accent">.</span>
                </h2>
                <p className="max-w-md text-sm leading-relaxed text-muted">จ่ายรายเดือนหรือครั้งเดียว ได้สิทธิ์ทันทีหลังชำระ หรือเปิดบัญชีผ่าน Exness IB เพื่อใช้ฟรี</p>
              </div>
              <ButtonLink href="/pricing" variant="outline">ดูราคาทั้งหมด · ซื้อรายตัว <ArrowRight className="size-4" /></ButtonLink>
            </Reveal>
            <Reveal delay={0.1}><CatalogView products={bundles} access={owned?.access} subscribed={owned?.subscribed} from="/pricing" bundlesOnly /></Reveal>
          </div>
        </section>
      )}

      <AboutSection />

      {/* CTA */}
      <section id="join" className="scroll-mt-18 px-4 py-16 sm:px-6 sm:py-24">
        <Reveal className="surface-dark relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-ink">
          <div className="brand-glow pointer-events-none absolute inset-0 opacity-70" />
          <VelocityMarquee items={["เริ่มเลย", "START NOW", "1SHOT"]} outline baseSpeed={1.5} className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-[7rem] font-black tracking-tighter text-white/[0.06] sm:text-[11rem]" />
          <div className="relative flex flex-col gap-8 p-6 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col items-start gap-5 sm:flex-row">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-white">
                <Rocket className="size-6" strokeWidth={1.8} />
              </span>
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">พร้อมรับสัญญาณแล้ว?</h2>
                  <p className="mt-1 text-sm text-muted">สมัครฟรี แล้วทำตาม 3 ขั้นตอนนี้</p>
                </div>
                <ol className="flex flex-wrap gap-2 text-xs">
                  {["สมัครสมาชิก", "ซื้อแพ็กเกจ หรือรับฟรีผ่าน Exness IB", "เชื่อม Telegram เข้าห้องสัญญาณ"].map((s, i) => (
                    <li key={s} className="flex items-center gap-2 rounded-full border border-line-strong px-3 py-1.5 text-muted">
                      <span className="num text-accent">{i + 1}</span>{s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <Magnetic strength={0.5} className="w-full sm:w-auto"><ButtonLink href="/signup" className="h-14 w-full shrink-0 px-8 text-base sm:w-auto">
              สมัครสมาชิก <ArrowRight className="size-4" />
            </ButtonLink></Magnetic>
          </div>
        </Reveal>
      </section>
    </main>
    </MotionRoot>
  );
}

function SectionHead({ eyebrow, title, aside }: { eyebrow: string; title: React.ReactNode; aside: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 md:items-end">
      <div className="space-y-3">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">{title}</h2>
      </div>
      <p className="max-w-md text-sm leading-relaxed text-muted md:justify-self-end">{aside}</p>
    </div>
  );
}

/** Tilted stack of sample UI — illustrative only. */
function HeroVisual() {
  return (
    <div className="relative">
      <TiltStage className="relative mx-auto max-w-md">
        {/* Back card: setup list */}
        <Depth z={-80} className="surface-light absolute top-10 -left-10 hidden w-60 rounded-2xl bg-panel p-4 shadow-2xl sm:block">
          <p className="text-[11px] font-semibold text-muted">Setup ล่าสุด</p>
          <ul className="mt-3 space-y-2.5">
            {SAMPLE_LIST.map((r) => (
              <li key={r.code} className="flex items-center gap-2.5">
                <span className="num grid size-7 place-items-center rounded-lg bg-brand-dim text-[10px] font-bold text-accent">{r.code}</span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium">{r.name}</span>
                <Badge tone={r.side === "BUY" ? "buy" : "sell"} className="num px-1.5 text-[9px]">{r.side}</Badge>
              </li>
            ))}
          </ul>
        </Depth>

        {/* Front card: ticket */}
        <Depth z={40} className="relative">
        <div className="relative animate-float rounded-3xl border border-line-strong bg-panel/85 p-1.5 shadow-[0_40px_100px_-30px_rgb(178_0_22/0.55)] backdrop-blur sm:ml-28">
          <div className="rounded-[20px] border border-line bg-panel-2">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="num grid size-9 place-items-center rounded-xl bg-brand text-xs font-bold text-white">AMD</span>
                <div>
                  <p className="text-sm font-semibold">AMD Pro · Distribution</p>
                  <p className="num text-[11px] text-muted">XAUUSD · M5 · Limit</p>
                </div>
              </div>
              <Badge tone="buy" className="num tracking-wider">BUY</Badge>
            </div>
            <div className="px-5 py-6">
              <PriceLadder side="BUY" entry={4380.5} sl={4372} tp={4401.75} />
            </div>
            <div className="flex items-center justify-between border-t border-line px-5 py-2.5 text-[11px] text-muted">
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-buy text-buy animate-pulse-dot" /> ราคาตัวอย่าง</span>
              <PriceTicker start={4386.2} />
            </div>
            <div className="grid grid-cols-3 border-t border-line text-center text-[11px] text-muted">
              {["SETUP", "RETEST", "TP"].map((s, i) => (
                <div key={s} className={`py-3 ${i < 2 ? "border-r border-line" : ""}`}>
                  <span className={i === 0 ? "font-semibold text-accent" : ""}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        </Depth>

        {/* Floating chip */}
        <Depth z={120} className="surface-light absolute -right-4 -bottom-6 hidden items-center gap-2.5 rounded-2xl bg-panel px-4 py-3 shadow-2xl sm:flex">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-white"><Send className="size-4" /></span>
          <div>
            <p className="text-xs font-semibold">ส่งเข้า Telegram แล้ว</p>
            <p className="text-[10px] text-muted">พร้อม Entry · SL · TP</p>
          </div>
          <ArrowUpRight className="size-4 text-faint" />
        </Depth>
      </TiltStage>
      <p className="mt-10 text-center text-[10px] text-faint lg:text-right">ภาพตัวอย่างการแสดงผล ไม่ใช่สัญญาณจริง</p>
    </div>
  );
}
