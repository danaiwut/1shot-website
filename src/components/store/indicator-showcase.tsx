"use client";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";
import { useReduce } from "@/components/motion/use-reduce";

/*
 * Homepage showcase: a headline whose words light up as it scrolls into view, then three phones side by side —
 * an indicator on TradingView in the middle, the resulting open profit on the left and the closed balance on the
 * right — fading into the background, with one "Choose Now" button.
 */

const PHONES = [
  { src: "/images/showcase/profit.jpg", alt: "กำไรของออเดอร์ XAUUSD ที่เปิดตามอินดิเคเตอร์ใน MT5" },
  { src: "/images/showcase/chart.jpg", alt: "อินดิเคเตอร์ 1SHOT บนกราฟทองคำใน TradingView พร้อมโซน Sell Limit, SL และขนาด Lot" },
  { src: "/images/showcase/closed.jpg", alt: "ยอดคงเหลือในบัญชี MT5 หลังปิดกำไร" },
];

export function IndicatorShowcase({ headline }: { headline: string[][] }) {
  return (
    <section id="indicators" aria-labelledby="indicators-title" className="relative scroll-mt-18 overflow-hidden bg-ink">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-[520px] -translate-y-1/4 bg-[radial-gradient(50%_60%_at_50%_50%,rgb(178_0_22/0.28),transparent_70%)]" />
      <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20">
        <ScrollHeadline lines={headline} />
        <Phones />
      </div>
      {/* Soft fade into the next section */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-panel-2" />
    </section>
  );
}

/** Words fade from dim to full white as the headline scrolls through the viewport. */
function ScrollHeadline({ lines }: { lines: string[][] }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduce = useReduce();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.35"] });
  const all = lines.flat();
  let n = 0;
  return (
    <h2 id="indicators-title" ref={ref} className="mx-auto max-w-4xl text-center text-[2.1rem] leading-[1.15] font-bold tracking-tight text-balance sm:text-6xl">
      <span className="sr-only">{lines.map((l) => l.join("")).join(" ")}</span>
      {lines.map((ws, l) => (
        <span key={l} aria-hidden className="block">
          {ws.map((w) => {
            const i = n++;
            return <Word key={i} word={w} progress={scrollYProgress} range={[i / all.length, (i + 1) / all.length]} lit={reduce} />;
          })}
        </span>
      ))}
    </h2>
  );
}

function Word({ word, progress, range, lit }: { word: string; progress: MotionValue<number>; range: [number, number]; lit: boolean }) {
  // 0.62 → 1: dim words stay readable as large text (≥ 4.5:1 on either theme), lit words are full strength.
  const opacity = useTransform(progress, range, [0.62, 1]);
  return <motion.span style={{ opacity: lit ? 1 : opacity }} className="text-fg">{word}</motion.span>;
}

/** Three phones side by side; the middle one larger and in front, the bottom fading out. */
function Phones() {
  return (
    <div className="relative mt-14 sm:mt-20">
      {/* The phones themselves fade out at the bottom (a mask, so it works on any background / theme) */}
      <ul className="relative mx-auto flex max-w-4xl items-start justify-center [mask-image:linear-gradient(to_bottom,black_45%,transparent_86%)]">
        {PHONES.map((p, i) => {
          const middle = i === 1;
          return (
            <li
              key={p.src}
              className={cn(
                "relative shrink-0",
                middle ? "z-20 w-[46%] max-w-[300px]" : "z-10 mt-[8%] w-[38%] max-w-[250px] opacity-85",
                i === 0 && "-mr-[6%]",
                i === 2 && "-ml-[6%]",
              )}
            >
              <Phone src={p.src} alt={p.alt} glow={middle} />
            </li>
          );
        })}
      </ul>
      <div className="relative z-40 -mt-28 flex justify-center sm:-mt-36">
        <Link
          href="/pricing"
          className="inline-flex h-13 items-center gap-2 rounded-full bg-white px-9 text-base font-bold text-[#0b0b0d] shadow-[0_20px_60px_-15px_rgb(178_0_22/0.9)] ring-1 ring-black/10 transition-transform hover:scale-[1.03]"
        >
          Choose Now <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </div>
  );
}

/** iPhone Pro Max–style frame with a screenshot as the screen. */
function Phone({ src, alt, glow }: { src: string; alt: string; glow: boolean }) {
  return (
    <div className={cn("rounded-[2.6rem] bg-[linear-gradient(145deg,#c9c3b8,#6b675f_30%,#2b2a28_55%,#8f8a80)] p-[3px] sm:rounded-[3rem] sm:p-[4px]", glow ? "shadow-[0_60px_130px_-30px_rgb(178_0_22/0.8)]" : "shadow-2xl")}>
      <div className="relative aspect-[506/1100] overflow-hidden rounded-[2.45rem] bg-black p-[6px] sm:rounded-[2.8rem] sm:p-[9px]">
        <div className="relative size-full overflow-hidden rounded-[2.1rem] bg-white sm:rounded-[2.3rem]">
          {/* eslint-disable-next-line @next/next/no-img-element -- static screenshot */}
          <img src={src} alt={alt} loading="lazy" className="absolute inset-0 size-full object-cover object-top" />
          <span aria-hidden className="absolute top-2 left-1/2 h-5 w-[34%] -translate-x-1/2 rounded-full bg-black sm:top-3 sm:h-6" />
        </div>
      </div>
    </div>
  );
}
