"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useReduce } from "./use-reduce";

/*
 * Hero = copy on the left, a phone on the right playing a looped TradingView replay of the indicators
 * (public/media/hero-phone-sweep.mp4). The site-wide pause switch (footer) stops the video too.
 */

export function LiveHero({ lines, redLine, description, children }: { lines: string[]; redLine: string; description: string; children?: React.ReactNode }) {
  const reduce = useReduce();

  return (
    <section className="relative -mt-18 flex min-h-[100svh] flex-col overflow-hidden bg-ink pt-18">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/3 h-[480px] w-[900px] rounded-full bg-brand/25 blur-[140px]" />
      <div aria-hidden className="pointer-events-none absolute right-0 bottom-10 h-[420px] w-[700px] rounded-full bg-brand/20 blur-[160px]" />

      <div className="relative mx-auto grid w-full max-w-7xl flex-1 items-center gap-8 px-4 pt-10 pb-8 sm:gap-10 sm:px-6 sm:pt-12 sm:pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-8 lg:py-16">
        <div className="min-w-0 max-w-[37rem]">
          <h1 className="text-[clamp(2rem,10vw,2.35rem)] leading-[1.12] font-black tracking-tight sm:text-5xl lg:text-[3.15rem] xl:text-[3.45rem]">
            {/* Screen readers get one stable sentence; the animated copy below is visual only. */}
            <span className="sr-only">{lines.join(" ")} {redLine}</span>
            {lines.map((line, index) => (
              <span key={line} aria-hidden className="-mt-[0.22em] block overflow-hidden pt-[0.22em] pb-[0.06em] sm:whitespace-nowrap">
                <motion.span
                  className="inline-block"
                  initial={{ y: "105%", filter: "blur(12px)" }} animate={{ y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 + index * 0.12 }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
            <span aria-hidden className="mt-2 block text-[0.48em] leading-tight tracking-[0.05em] text-brand dark:text-[#ff2e43]">
              {redLine}
            </span>
          </h1>

          <motion.p
            className="mt-7 max-w-[34rem] text-base leading-relaxed text-muted sm:text-lg"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }}
          >
            {description}
          </motion.p>
          <motion.div className="mt-8 grid gap-3 min-[430px]:flex min-[430px]:flex-wrap sm:mt-9" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.8 }}>
            <Link href="#indicators" className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-brand px-5 text-center text-base font-semibold text-white shadow-[0_20px_60px_-15px_rgb(178_0_22/0.9)] sm:px-7">
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">เลือกอินดิเคเตอร์</span>
              <ArrowRight className="relative size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="/pricing" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-line-strong bg-panel/60 px-5 text-center text-base font-medium text-fg backdrop-blur transition-colors hover:bg-panel-3 sm:px-7">
              ดูแพ็กเกจและราคา
            </a>
          </motion.div>
        </div>

        <Devices paused={reduce} />
      </div>

      <div className="relative">{children}</div>
    </section>
  );
}

const EASE = [0.16, 1, 0.3, 1] as const;
const preserve = { transformStyle: "preserve-3d" } as const;

/** Muted looping video that follows the site-wide pause switch. */
function usePlayback(paused: boolean) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused]);
  return ref;
}

/** A single large iPhone, centered, playing the replay video. */
function Devices({ paused }: { paused: boolean }) {
  return (
    <figure className="@container relative mx-auto w-full max-w-[420px] lg:max-w-[480px]">
      <div className="relative aspect-[3/4] text-[6.4cqw] [perspective:150em]">
        <IPhone paused={paused} />
        {/* Ground shadow + brand glow */}
        <div aria-hidden className="pointer-events-none absolute top-[82%] left-1/2 -z-10 h-[16%] w-[70%] -translate-x-1/2 rounded-[50%] bg-black/35 blur-2xl dark:bg-black/90" />
        <div aria-hidden className="pointer-events-none absolute top-[18%] left-1/2 -z-20 h-[65%] w-[65%] -translate-x-1/2 rounded-full bg-brand/35 blur-[90px]" />
      </div>
    </figure>
  );
}

/*
 * iPhone Pro Max: titanium frame, thin bezel, Dynamic Island, side buttons on the visible right edge.
 * Centered in the frame, facing the viewer, floating gently.
 */
function IPhone({ paused }: { paused: boolean }) {
  const video = usePlayback(paused);
  const PW = 9.2, PH = 19.6, PT = 0.5; // width, height, thickness (em) — ~19.5:9 body

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ ...preserve, width: `${PW}em`, height: `${PH}em` }}
      initial={{ opacity: 0, y: "5em" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5, delay: 0.4, ease: EASE }}
    >
      <div className="size-full" style={preserve}>
        {/* Front: titanium rim → black bezel → screen */}
        <div className="absolute inset-0 rounded-[1.35em] bg-[linear-gradient(140deg,#8d9097,#3a3c41_40%,#6f727a)] p-[0.14em] shadow-[0_2.5em_4em_-1.5em_rgb(0_0_0/0.9),0_0_3em_-1em_rgb(178_0_22/0.6)]">
          <div className="size-full rounded-[1.24em] bg-black p-[0.26em]">
            <div className="relative size-full overflow-hidden rounded-[1em] bg-black">
              <video
                ref={video}
                className="absolute inset-0 size-full object-cover"
                src="/media/hero-phone-sweep.mp4"
                poster="/media/hero-phone-sweep.jpg"
                autoPlay muted loop playsInline preload="auto"
                aria-label="วิดีโอตัวอย่าง 1SHOT ICT Sweep Model บนมือถือ"
              />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgb(255_255_255/0.14)_0%,transparent_35%)]" />
              {/* Dynamic Island */}
              <div aria-hidden className="absolute top-[0.45em] left-1/2 h-[0.62em] w-[2.1em] -translate-x-1/2 rounded-full bg-black" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
