import Image from "next/image";
import { ArrowRight, CandlestickChart, MonitorSmartphone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cx } from "@/components/ui";

/*
 * About band: the founder (cut out, no frame) in front of his funded-trader proof cards,
 * then the story, three product facts and one action.
 * Follows the selected theme (dark-red / light-red) like the rest of the page.
 */

const PHOTO = { src: "/images/founder-cut.png", alt: "ผู้ก่อตั้ง 1SHOT" };
/** Proof cards behind the founder: where each sits (tilted, peeking out left / right / top). */
const PROOF = [
  { src: "/images/proof/lucid.jpg", alt: "บัญชี LucidFlex 50K แบบ Funded หลายบัญชี", place: "top-[6%] left-[22%] h-[30%] w-[56%] rotate-[4deg]", delay: "-1s" },
  { src: "/images/proof/topstep.jpg", alt: "ใบรับรอง Certified Funded Trader จาก Topstep", place: "top-[30%] -left-[6%] h-[34%] w-[50%] -rotate-[9deg]", delay: "-3s" },
  { src: "/images/proof/fundingpips.jpg", alt: "อันดับ 13 บนตารางผู้นำ Funding Pips บัญชี $100,000 กำไร 15.56%", place: "top-[26%] -right-[8%] h-[30%] w-[52%] rotate-[8deg]", delay: "-5s" },
];

export function AboutSection({ indicatorCount = 10, actionHref = "/signup", actionLabel = "สมัครสมาชิกฟรี" }: {
  indicatorCount?: number; actionHref?: string; actionLabel?: string;
}) {
  const facts = [
    { icon: CandlestickChart, v: `${indicatorCount}+`, k: "อินดิเคเตอร์", d: "บน TradingView" },
    { icon: ShieldCheck, v: "WF1", k: "มาตรฐานสัญญาณ", d: "ตรวจทุกฟิลด์ก่อนรับ" },
    { icon: MonitorSmartphone, v: "2", k: "ช่องทาง", d: "เว็บ + Telegram" },
  ];

  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-18 overflow-x-clip bg-panel">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
        {/* Portrait: founder cut out in front, his funded-trader proof as tilted cards behind */}
        <figure className="relative mx-auto w-full max-w-lg">
          <div className="relative aspect-[10/11]">
            {/* No frame: a soft glow that fades out on every side */}
            <div aria-hidden className="pointer-events-none absolute -inset-[10%] hidden bg-[radial-gradient(50%_45%_at_50%_62%,rgb(178_0_22/0.3),transparent_70%)] dark:block" />
            {PROOF.map((p) => (
              <div key={p.src} aria-hidden className={cx("absolute overflow-hidden rounded-xl border-4 border-white bg-white shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)] animate-float", p.place)} style={{ animationDelay: p.delay }}>
                <Image src={p.src} alt="" fill sizes="(min-width: 1024px) 16rem, 45vw" className="object-cover object-left-top" />
              </div>
            ))}
            {/* The cut-out fades out at the bottom instead of ending on a hard edge */}
            <div className="absolute inset-0 z-10 [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]">
              <Image
                src={PHOTO.src}
                alt={PHOTO.alt}
                fill
                loading="eager"
                sizes="(min-width: 1024px) 32rem, 90vw"
                className="object-contain object-bottom"
              />
            </div>
          </div>
          {/* Badge */}
          <div className="surface-dark absolute -top-4 -right-2 z-20 grid size-24 place-items-center rounded-full border-2 border-white/80 bg-[#0d0d10] text-center text-white shadow-lg sm:size-28">
            <p>
              <span className="num block text-2xl leading-none font-black sm:text-3xl">{indicatorCount}+</span>
              <span className="mt-1 block text-xs leading-tight font-semibold">ระบบเทรด<br />สำหรับทองคำ</span>
            </p>
          </div>
          <figcaption className="mt-4 text-center text-sm text-muted">
            ผู้ก่อตั้ง 1SHOT · Funded Trader กับ Topstep, Funding Pips และ LucidFlex
            <span className="sr-only">: {PROOF.map((p) => p.alt).join(" · ")}</span>
          </figcaption>
        </figure>

        {/* Story */}
        <div>
          <p className="text-sm font-bold text-accent">เกี่ยวกับ 1SHOT</p>
          <h2 id="about-title" className="mt-4 text-4xl leading-[1.1] font-black tracking-tight text-fg sm:text-5xl">
            เปลี่ยนกราฟทองคำ<br />ให้เป็นแผนเทรด<br />ที่ตรวจสอบได้<span className="text-brand dark:text-[#ff2e43]">.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted">
            1SHOT พัฒนาอินดิเคเตอร์สำหรับ XAUUSD บน TradingView ตั้งแต่ SMC, ICT จนถึง Supply &amp; Demand
            ทุกสัญญาณส่งผ่านมาตรฐาน WF1 เดียวกัน พร้อม Entry, SL และ TP ตั้งแต่วินาทีที่เกิด Setup
            เพื่อให้คุณวางแผนก่อนเข้าและย้อนตรวจผลได้ด้วยตัวเอง
          </p>

          <ul className="mt-8 grid gap-5 sm:grid-cols-3">
            {facts.map((f) => (
              <li key={f.k} className="flex items-start gap-3">
                <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-accent text-accent">
                  <f.icon className="size-5" strokeWidth={1.8} />
                </span>
                <p>
                  <span className="num block text-2xl leading-none font-black text-fg">{f.v}</span>
                  <span className="mt-1 block text-sm leading-snug font-semibold text-fg">{f.k}</span>
                  <span className="block text-sm leading-snug text-muted">{f.d}</span>
                </p>
              </li>
            ))}
          </ul>

          <Link
            href={actionHref}
            className="mt-9 inline-flex h-12 items-center gap-2 rounded-lg bg-fg px-6 text-sm font-semibold tracking-wide text-ink transition-colors hover:bg-brand hover:text-white"
          >
            {actionLabel} <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>

    </section>
  );
}
