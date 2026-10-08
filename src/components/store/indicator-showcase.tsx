"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import type { PublicIndicator } from "@/lib/indicators";
import { cn } from "@/lib/utils";
import { useReduce } from "@/components/motion/use-reduce";
import type { IndicatorOffer } from "./indicator-explorer";

/*
 * Homepage indicator showcase: a headline whose words light up as it scrolls into view, then a
 * three-phone carousel — the featured indicator large in the middle, its neighbours peeking from the
 * sides — with one call to action under the centre phone.
 */

export function IndicatorShowcase({ headline, indicators, offers }: {
  headline: string[][]; indicators: PublicIndicator[]; offers: IndicatorOffer[];
}) {
  return (
    <section id="indicators" aria-labelledby="indicators-title" className="relative scroll-mt-18 overflow-hidden bg-ink">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-[520px] -translate-y-1/4 bg-[radial-gradient(50%_60%_at_50%_50%,rgb(178_0_22/0.28),transparent_70%)]" />
      <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-20 sm:px-6 sm:pt-28 sm:pb-24">
        <ScrollHeadline lines={headline} />
        {indicators.length > 0 && <PhoneCarousel indicators={indicators} offers={offers} />}
      </div>
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

function PhoneCarousel({ indicators, offers, compact = false }: { indicators: PublicIndicator[]; offers: IndicatorOffer[]; compact?: boolean }) {
  const start = Math.max(0, indicators.findIndex((i) => i.code === "AMD"));
  const [index, setIndex] = useState(start);
  const touch = useRef<number | null>(null);
  const count = indicators.length;
  const go = (d: number) => setIndex((i) => (i + d + count) % count);
  const current = indicators[index];
  const offer = offers.find((o) => o.code === current.code);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="อินดิเคเตอร์ของ 1SHOT"
      className={compact ? "min-w-0" : "mt-14 sm:mt-20"}
      onKeyDown={(e) => { if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); }}
    >
      <div
        className="relative mx-auto h-[540px] max-w-4xl select-none sm:h-[600px]"
        // Swipe on touch screens; mouse users get the arrows and code chips.
        onPointerDown={(e) => { touch.current = e.pointerType === "mouse" ? null : e.clientX; }}
        onPointerUp={(e) => {
          if (touch.current === null) return;
          const dx = e.clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        {indicators.map((ind, i) => {
          let d = i - index;
          if (d > count / 2) d -= count;
          if (d < -count / 2) d += count;
          const side = Math.abs(d) === 1;
          const shown = d === 0 || side;
          return (
            <div
              key={ind.code}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} จาก ${count}: ${ind.name}`}
              aria-hidden={d !== 0}
              inert={d !== 0}
              className={cn(
                "absolute top-0 left-1/2 w-[230px] transition-[transform,opacity,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-[280px]",
                d === 0 ? "z-20" : "z-10",
                !shown && "pointer-events-none opacity-0",
                side && "opacity-55 blur-[1px] sm:opacity-70",
              )}
              style={{ transform: `translateX(calc(-50% + ${d * 78}%)) scale(${d === 0 ? 1 : 0.84}) translateY(${d === 0 ? 0 : 6}%)` }}
            >
              <Phone indicator={ind} price={offers.find((o) => o.code === ind.code)} featured={d === 0} />
            </div>
          );
        })}
      </div>

      <div className="relative z-30 -mt-10 flex flex-col items-center gap-6">
        <Link
          href={`/indicators/${current.code}`}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-fg px-7 text-base font-semibold text-ink shadow-[0_20px_60px_-15px_rgb(178_0_22/0.9)] transition-transform hover:scale-[1.03]"
        >
          ดูรายละเอียด {current.name} <ArrowRight aria-hidden className="size-4" />
        </Link>
        <p aria-live="polite" className="sr-only">กำลังแสดง {current.name}{offer?.price ? ` ราคา ${offer.price}${offer.suffix ? ` ${offer.suffix}` : ""}` : ""}</p>

        <div className="flex w-full max-w-3xl items-center gap-2">
          <button type="button" onClick={() => go(-1)} aria-label="อินดิเคเตอร์ก่อนหน้า" className="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong text-fg hover:bg-panel-3">
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <ul className="flex flex-1 gap-1.5 overflow-x-auto px-1 py-1 [scrollbar-width:none] sm:justify-center">
            {indicators.map((ind, i) => (
              <li key={ind.code}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-pressed={i === index}
                  aria-label={ind.name}
                  className={cn(
                    "num inline-flex h-11 min-w-11 items-center justify-center rounded-full border px-3 text-sm font-semibold transition-colors",
                    i === index ? "border-brand bg-brand text-white" : "border-line-strong text-fg hover:border-fg",
                  )}
                >
                  {ind.code}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => go(1)} aria-label="อินดิเคเตอร์ถัดไป" className="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong text-fg hover:bg-panel-3">
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** iPhone-style frame showing one indicator (its uploaded chart image when there is one). */
function Phone({ indicator: i, price, featured }: { indicator: PublicIndicator; price?: IndicatorOffer; featured: boolean }) {
  const reference = i.is_reference || i.modes.length === 0;
  return (
    <div className={cn("rounded-[2.6rem] bg-[linear-gradient(140deg,#8d9097,#2e3035_45%,#6f727a)] p-[3px]", featured ? "shadow-[0_50px_120px_-30px_rgb(178_0_22/0.75)]" : "shadow-2xl")}>
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2.45rem] bg-black p-2.5">
        <div className="relative flex size-full flex-col overflow-hidden rounded-[2rem] bg-[#0b0b0d] px-4 pt-3 pb-4 text-white">
          {/* status bar + Dynamic Island */}
          <div aria-hidden className="flex items-center justify-between text-[11px] font-semibold text-white/85">
            <span className="num">9:41</span>
            <span className="h-5 w-20 rounded-full bg-black" />
            <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-[2px] border border-white/70" /></span>
          </div>

          <div className="mt-5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-white/65">อินดิเคเตอร์</p>
              <p className="mt-0.5 text-xl leading-tight font-bold">{i.name}</p>
            </div>
            <span className="num grid size-12 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold">{i.code}</span>
          </div>

          <div className="mt-4 flex-1 overflow-hidden rounded-3xl bg-[linear-gradient(160deg,#d6001c,#8a0011)] p-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-xs font-semibold">
              <span aria-hidden className="size-1.5 rounded-full bg-white" />{i.family}
            </span>
            {i.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded image from Supabase Storage
              <img src={i.image_url} alt="" className="mt-3 aspect-[4/3] w-full rounded-xl object-cover" />
            ) : (
              <p className="mt-3 line-clamp-4 text-base leading-snug font-semibold">{i.description}</p>
            )}
            <p className="mt-3 text-sm text-white/85">{reference ? "ข้อมูลอ้างอิง สมาชิกทุกคนดูได้" : `เข้าแบบ ${i.modes.join(" / ")}`}</p>
          </div>

          <div className="mt-4">
            <p className="text-xs text-white/65">{price?.suffix ? "ราคาเริ่มต้น" : "ราคา"}</p>
            <p className="num mt-0.5 text-2xl font-bold">{price?.price ?? "—"}{price?.suffix && <span className="ml-1 text-sm font-normal text-white/65">{price.suffix}</span>}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

