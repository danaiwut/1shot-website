"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useReduce } from "./use-reduce";

/*
 * Hero = copy on the left, a MacBook on the right playing a looped TradingView replay of the indicators
 * (public/media/hero-macbook.mp4, already encoded at 2× speed). The site-wide pause switch (footer) stops the video too.
 */

const WORDS = ["ทุก Setup", "ทุก Entry", "ทุก TP"];

export function LiveHero({ lines, children }: { lines: string[][]; children?: React.ReactNode }) {
  const reduce = useReduce();
  const [i, setI] = useState(WORDS.length - 1);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, [reduce]);

  return (
    <section className="relative -mt-18 flex min-h-[100svh] flex-col overflow-hidden bg-ink pt-18">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/3 h-[480px] w-[900px] rounded-full bg-brand/25 blur-[140px]" />
      <div aria-hidden className="pointer-events-none absolute right-0 bottom-10 h-[420px] w-[700px] rounded-full bg-brand/20 blur-[160px]" />

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 pt-12 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-10 lg:py-16">
        <div>
          <h1 className="text-[2.4rem] leading-[1.08] font-black tracking-tight sm:text-6xl lg:text-[3.6rem] xl:text-[4rem]">
            {/* Screen readers get one stable sentence; the animated copy below is visual only. */}
            <span className="sr-only">{lines.map((ws) => ws.join("")).join(" ")} ทุกจุด</span>
            {lines.map((ws, l) => (
              <span key={l} aria-hidden className="block">
                {ws.map((w, j) => (
                  <span key={j} className="-mt-[0.35em] inline-block overflow-hidden pt-[0.35em] pb-[0.1em] align-bottom">
                    <motion.span
                      className="inline-block"
                      initial={{ y: "105%", filter: "blur(12px)" }} animate={{ y: 0, filter: "blur(0px)" }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 + (l * 3 + j) * 0.07 }}
                    >
                      {w}
                    </motion.span>
                  </span>
                ))}
              </span>
            ))}
            {/* Slot-machine word, solid red (#ff2e43 = 5.7:1 on black, AAA for large text) */}
            <span aria-hidden className="relative -mt-[0.3em] block h-[1.3em] overflow-hidden pt-[0.3em]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={WORDS[i]}
                  className="absolute left-0 block whitespace-nowrap text-brand dark:text-[#ff2e43]"
                  initial={{ y: "100%", rotateX: -80, opacity: 0 }}
                  animate={{ y: "0%", rotateX: 0, opacity: 1 }}
                  exit={{ y: "-100%", rotateX: 80, opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  {WORDS[i]}<span className="text-fg">.</span>
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <motion.p
            className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }}
          >
            อินดิเคเตอร์ 1SHOT ส่ง Setup พร้อม Entry, SL และ TP ตั้งแต่วินาทีที่เกิดสัญญาณ ตรงจาก TradingView ถึงเว็บและ Telegram ตรวจย้อนได้ทุกจุด
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.8 }}>
            <Link href="#indicators" className="group relative inline-flex h-14 items-center gap-2 overflow-hidden rounded-2xl bg-brand px-7 text-base font-semibold text-white shadow-[0_20px_60px_-15px_rgb(178_0_22/0.9)]">
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">เลือกอินดิเคเตอร์</span>
              <ArrowRight className="relative size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="/pricing" className="inline-flex h-14 items-center gap-2 rounded-2xl border border-line-strong bg-panel/60 px-7 text-base font-medium text-fg backdrop-blur transition-colors hover:bg-panel-3">
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

const KEY_ROWS = [14, 14, 14, 13, 12, 9];
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

/*
 * MacBook Pro built from CSS 3D planes, seen from the front-left like a product shot:
 * a flat keyboard deck and a lid hinged at its back edge with the replay video on the screen.
 * Everything is sized in em; the figure sets font-size from its own width (cqw), so it scales with the column.
 */
/** MacBook with an iPhone standing beside it, sharing one perspective. */
function Devices({ paused }: { paused: boolean }) {
  return (
    <figure className="@container relative mx-auto w-full max-w-[640px] lg:max-w-none">
      <div className="relative aspect-[10/8] text-[2.2cqw] [perspective:150em]">
        <MacBook paused={paused} />
        <IPhone paused={paused} />
        {/* Ground shadow + brand glow */}
        <div aria-hidden className="pointer-events-none absolute top-[66%] left-[12%] -z-10 h-[22%] w-[78%] rotate-[16deg] rounded-[50%] bg-black/35 blur-2xl dark:bg-black/90" />
        <div aria-hidden className="pointer-events-none absolute top-[20%] left-[20%] -z-20 h-[60%] w-[60%] rounded-full bg-brand/35 blur-[90px]" />
      </div>
    </figure>
  );
}

function MacBook({ paused }: { paused: boolean }) {
  const video = usePlayback(paused);
  const ease = EASE;
  const W = 30, D = 20.6, H = 19.4, T = 0.75; // width, deck depth, lid height, deck thickness (em)
  const flat = preserve;

  return (
        <motion.div
          className="absolute top-[55%] left-[55%] size-0 lg:left-[50%]"
          style={flat}
          initial={{ rotateX: -26, rotateY: -62, opacity: 0, y: "3em" }}
          animate={{ rotateX: -26, rotateY: -38, opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 0.3, ease }}
        >
          {/* Deck: top surface lies flat (rotateX 90°) and runs from the hinge toward the viewer */}
          <div className="absolute" style={{ ...flat, left: `${-W / 2}em`, top: 0, width: `${W}em`, height: `${D}em`, transformOrigin: "top center", transform: "rotateX(90deg)" }}>
            <div className="absolute inset-0 rounded-[1.1em] bg-[linear-gradient(160deg,#4a4d54,#2c2e33_55%,#25272b)] shadow-[inset_0_0_0_0.06em_rgb(255_255_255/0.18)]">
              {/* Speaker grilles */}
              <div className="absolute top-[1.4em] bottom-[9.6em] left-[0.9em] w-[2.2em] rounded-[0.3em] bg-[radial-gradient(circle,#15161a_28%,transparent_32%)] bg-[length:0.42em_0.42em] opacity-80" />
              <div className="absolute top-[1.4em] right-[0.9em] bottom-[9.6em] w-[2.2em] rounded-[0.3em] bg-[radial-gradient(circle,#15161a_28%,transparent_32%)] bg-[length:0.42em_0.42em] opacity-80" />
              {/* Keyboard */}
              <div className="absolute top-[1.4em] right-[3.6em] left-[3.6em] flex flex-col gap-[0.22em] rounded-[0.4em] bg-[#121315] p-[0.3em]">
                {KEY_ROWS.map((n, r) => (
                  <div key={r} className={`flex gap-[0.22em] ${r === 0 ? "h-[0.7em]" : "h-[1.42em]"}`}>
                    {Array.from({ length: n }, (_, k) => (
                      <span
                        key={k}
                        className="flex-1 rounded-[0.18em] bg-[linear-gradient(#26272b,#1a1b1e)] shadow-[inset_0_-0.05em_0_rgb(255_255_255/0.06)]"
                        style={{ flexGrow: r === 5 && k === 3 ? 6 : (r === 3 || r === 4) && (k === 0 || k === n - 1) ? 1.8 : 1 }}
                      />
                    ))}
                  </div>
                ))}
              </div>
              {/* Trackpad */}
              <div className="absolute bottom-[1em] left-1/2 h-[7.6em] w-[12.6em] -translate-x-1/2 rounded-[0.6em] bg-[linear-gradient(160deg,#41444b,#30333a)] shadow-[inset_0_0_0_0.06em_rgb(255_255_255/0.14)]" />
              {/* Front notch */}
              <div className="absolute bottom-0 left-1/2 h-[0.35em] w-[4em] -translate-x-1/2 rounded-t-[0.35em] bg-[#1b1c20]" />
            </div>
          </div>
          {/* Deck edges (front and the visible right side with its ports) */}
          <div className="absolute rounded-b-[0.5em] bg-[linear-gradient(#5d6067,#2b2d31)]" style={{ left: `${-W / 2}em`, top: 0, width: `${W}em`, height: `${T}em`, transform: `translateZ(${D}em)` }} />
          <div className="absolute bg-[linear-gradient(#4b4e55,#222327)]" style={{ left: `${W / 2}em`, top: 0, width: `${D}em`, height: `${T}em`, transformOrigin: "left top", transform: "rotateY(-90deg)" }}>
            <span className="absolute top-[0.25em] left-[6em] h-[0.22em] w-[1.4em] rounded-full bg-black/70" />
            <span className="absolute top-[0.25em] left-[8em] h-[0.22em] w-[0.9em] rounded-full bg-black/70" />
          </div>

          {/* Lid: hinged at the back edge, opened ~105° */}
          <motion.div
            className="absolute"
            style={{ ...flat, left: `${-W / 2}em`, top: `${-H}em`, width: `${W}em`, height: `${H}em`, transformOrigin: "bottom center" }}
            initial={{ rotateX: -88 }}
            animate={{ rotateX: 14 }}
            transition={{ duration: 1.5, delay: 0.7, ease }}
          >
            {/* Lid back (aluminium), seen only while it swings open */}
            <div className="absolute inset-0 rounded-[1em] bg-[linear-gradient(160deg,#55585f,#2a2c30)] [backface-visibility:hidden] [transform:rotateY(180deg)_translateZ(0.05em)]" />
            <div className="absolute inset-0 rounded-[1em] bg-[#0a0a0c] p-[0.55em] pb-[0.9em] shadow-[inset_0_0_0_0.07em_#5b5e65] [backface-visibility:hidden]">
              <div className="relative size-full overflow-hidden rounded-[0.35em] bg-black">
                <video
                  ref={video}
                  className="absolute inset-0 size-full object-cover"
                  src="/media/hero-macbook.mp4"
                  poster="/media/hero-macbook.jpg"
                  autoPlay muted loop playsInline preload="auto"
                  aria-label="วิดีโอตัวอย่าง อินดิเคเตอร์ 1SHOT ทำงานบนกราฟทองคำใน TradingView"
                />
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.12)_0%,transparent_40%)]" />
                {/* Camera notch */}
                <div aria-hidden className="absolute top-0 left-1/2 h-[0.75em] w-[3.6em] -translate-x-1/2 rounded-b-[0.3em] bg-[#0a0a0c]" />
              </div>
            </div>
          </motion.div>
        </motion.div>
  );
}

/*
 * iPhone Pro Max: titanium frame, thin bezel, Dynamic Island, side buttons on the visible right edge.
 * Stands in front of the MacBook's right corner, facing the viewer, floating gently.
 */
function IPhone({ paused }: { paused: boolean }) {
  const video = usePlayback(paused);
  const PW = 9.2, PH = 19.6, PT = 0.5; // width, height, thickness (em) — ~19.5:9 body

  return (
    <motion.div
      className="absolute right-[1%] bottom-[1%]"
      style={{ ...preserve, width: `${PW}em`, height: `${PH}em` }}
      initial={{ opacity: 0, y: "5em" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5, delay: 1.1, ease: EASE }}
    >
      <motion.div
        className="size-full"
        style={preserve}
        animate={paused ? { y: 0 } : { y: ["0em", "-0.45em", "0em"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2.6 }}
      >
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
      </motion.div>
    </motion.div>
  );
}
