"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useReduce } from "./use-reduce";

/*
 * Hero = a live (simulated) XAUUSD chart filling the screen. Every few seconds a signal fires:
 * entry marker → Entry/SL/TP lines draw across → price runs to target → TP flashes, Telegram toast.
 * The headline's last word and the glass ticket follow the same cycle. Purely illustrative.
 */

type Candle = { o: number; h: number; l: number; c: number };
type Phase = "setup" | "entry" | "run" | "hit";
type Trade = { id: number; side: "BUY" | "SELL"; entry: number; sl: number; tp: number; at: number; phase: Phase; ind: (typeof INDICATORS)[number] };

const INDICATORS = [
  { code: "AMD", name: "AMD Pro · Distribution" },
  { code: "OB", name: "Orderblock · Retest" },
  { code: "SW", name: "Sweep Model · CISD" },
  { code: "SD", name: "Supply and Demand" },
] as const;

const N = 54;              // visible candles
const W = 1440, H = 720;   // svg viewBox
// Lower bound sits well below the action so trades play out in the upper part, clear of the ticket.
const MIN = 4296, MAX = 4428;
const BASE = 4381;
const y = (p: number) => ((MAX - p) / (MAX - MIN)) * H;
const cw = W / N;

function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
}
function seedCandles(): Candle[] {
  const r = rng(7);
  const out: Candle[] = [];
  let c = BASE;
  for (let i = 0; i < N; i++) {
    const o = c;
    c = o + (r() - 0.5) * 5 + (BASE - o) * 0.08;
    out.push({ o, c, h: Math.max(o, c) + r() * 2.4, l: Math.min(o, c) - r() * 2.4 });
  }
  return out;
}
const round = (p: number) => Math.round(p * 4) / 4;
const fmt = (p: number) => p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const WORD: Record<Phase | "idle", string> = { idle: "ทุกจุด", setup: "ทุก Setup", entry: "ทุก Entry", run: "ทุก Entry", hit: "ทุก TP" };

export function LiveHero({ lines, children }: { lines: string[][]; children?: React.ReactNode }) {
  const reduce = useReduce();
  const [candles, setCandles] = useState<Candle[]>(seedCandles);
  const [trade, setTrade] = useState<Trade | null>(null);
  const state = useRef({ tick: 0, idle: 0, n: 0, trade: null as Trade | null, phaseCandles: 0, candles: candles });

  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => {
      const s = state.current;
      s.tick++;
      {
        const next = s.candles.slice();
        const last = { ...next[next.length - 1] };
        const t = s.trade;
        let drift = (BASE - last.c) * 0.03;
        let noise = (Math.random() - 0.5) * 1.6;
        if (t) {
          const dir = t.side === "BUY" ? 1 : -1;
          if (t.phase === "setup") drift = (t.entry - dir * 1.5 - last.c) * 0.12;
          if (t.phase === "entry") drift = (t.entry - last.c) * 0.25;
          if (t.phase === "run") { drift = dir * 0.95; noise *= 0.8; }
          if (t.phase === "hit") drift = (t.tp - last.c) * 0.15;
        }
        last.c = last.c + drift + noise;
        last.h = Math.max(last.h, last.c);
        last.l = Math.min(last.l, last.c);
        next[next.length - 1] = last;

        // Advance the trade
        if (t) {
          const reached = t.side === "BUY" ? last.c >= t.tp : last.c <= t.tp;
          if (t.phase === "run" && reached) { s.trade = { ...t, phase: "hit" }; s.phaseCandles = 0; }
        }

        // New candle every 7 ticks
        if (s.tick % 7 === 0) {
          next.shift();
          next.push({ o: last.c, h: last.c, l: last.c, c: last.c });
          if (s.trade) s.trade = { ...s.trade, at: s.trade.at - 1 };
          s.phaseCandles++;
          const tr = s.trade;
          if (!tr) {
            s.idle++;
            if (s.idle >= 5) {
              s.idle = 0;
              s.n++;
              const side = last.c < BASE + 1 ? "BUY" : "SELL";
              const dir = side === "BUY" ? 1 : -1;
              const entry = round(last.c);
              s.trade = { id: s.n, side, entry, sl: entry - dir * 8.5, tp: entry + dir * 21.25, at: N - 1, phase: "setup", ind: INDICATORS[s.n % INDICATORS.length] };
              s.phaseCandles = 0;
            }
          } else if (tr.phase === "setup" && s.phaseCandles >= 3) { s.trade = { ...tr, phase: "entry" }; s.phaseCandles = 0; }
          else if (tr.phase === "entry" && s.phaseCandles >= 2) { s.trade = { ...tr, phase: "run" }; s.phaseCandles = 0; }
          else if (tr.phase === "hit" && s.phaseCandles >= 5) { s.trade = null; s.phaseCandles = 0; }
        }
        s.candles = next;
        setCandles(next);
        setTrade(s.trade);
      }
    }, 130);
    return () => clearInterval(timer);
  }, [reduce]);

  const last = candles[candles.length - 1];
  const phase: Phase | "idle" = trade?.phase ?? "idle";

  return (
    <section className="surface-dark relative -mt-18 flex min-h-[100svh] flex-col overflow-hidden bg-black pt-18">
      {/* Chart */}
      <div aria-hidden className="relative order-2 h-[42svh] max-h-[380px] min-h-[260px] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_80%,transparent)] lg:absolute lg:inset-0 lg:order-none lg:mx-0 lg:h-auto lg:max-h-none lg:[mask-image:linear-gradient(to_right,transparent_8%,black_45%)]">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMaxYMid slice" className="absolute inset-0 size-full">
          <defs>
            <linearGradient id="hero-fade" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#b20016" stopOpacity=".28" />
              <stop offset="1" stopColor="#b20016" stopOpacity="0" />
            </linearGradient>
            <filter id="hero-glow"><feGaussianBlur stdDeviation="6" /></filter>
          </defs>
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1="0" x2={W} y1={(H / 9) * (i + 0.5)} y2={(H / 9) * (i + 0.5)} stroke="rgb(255 255 255 / .05)" />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`v${i}`} y1="0" y2={H} x1={(W / 12) * i} x2={(W / 12) * i} stroke="rgb(255 255 255 / .03)" />
          ))}

          {/* Area under closes */}
          <path
            d={`M0 ${H} ${candles.map((k, i) => `L${i * cw + cw / 2} ${y(k.c)}`).join(" ")} L${W} ${H} Z`}
            fill="url(#hero-fade)"
          />

          {/* Candles */}
          {candles.map((k, i) => {
            const up = k.c >= k.o;
            const color = up ? "#34c79a" : "#ff4d61";
            const x = i * cw + cw / 2;
            const top = y(Math.max(k.o, k.c));
            const live = i === candles.length - 1;
            return (
              <g key={i} opacity={0.35 + (i / N) * 0.65}>
                <line x1={x} x2={x} y1={y(k.h)} y2={y(k.l)} stroke={color} strokeWidth="2" />
                <rect x={x - cw * 0.3} y={top} width={cw * 0.6} height={Math.max(2, Math.abs(y(k.o) - y(k.c)))} rx="2" fill={color} />
                {live && <rect x={x - cw * 0.3} y={top} width={cw * 0.6} height={Math.max(2, Math.abs(y(k.o) - y(k.c)))} rx="2" fill={color} filter="url(#hero-glow)" />}
              </g>
            );
          })}

          {/* Live price line */}
          <line x1="0" x2={W} y1={y(last.c)} y2={y(last.c)} stroke="#fff" strokeOpacity=".25" strokeDasharray="3 6" />
          <g transform={`translate(${W - 118} ${y(last.c) - 15})`}>
            <rect width="112" height="30" rx="6" fill={last.c >= last.o ? "#0f7a56" : "#b20016"} />
            <text x="56" y="20" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" fontFamily="var(--font-mono)">{fmt(last.c)}</text>
          </g>

          {/* Signal */}
          <AnimatePresence>
            {trade && (
              <motion.g key={trade.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.6 } }}>
                {[
                  { p: trade.tp, c: "#34c79a", l: `TP ${fmt(trade.tp)}` },
                  { p: trade.entry, c: "#ffffff", l: `จุดเข้า ${fmt(trade.entry)}` },
                  { p: trade.sl, c: "#ff4d61", l: `SL ${fmt(trade.sl)}` },
                ].map((lv, i) => (
                  <g key={lv.l}>
                    <motion.line
                      x1={trade.at * cw + cw / 2} x2={W - 124} y1={y(lv.p)} y2={y(lv.p)}
                      stroke={lv.c} strokeWidth={i === 1 ? 2 : 1.6} strokeDasharray={i === 1 ? undefined : "8 7"}
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, delay: 0.15 * i, ease: [0.16, 1, 0.3, 1] }}
                    />
                    <motion.text
                      x={W - 132} y={y(lv.p) - 9} textAnchor="end" fontSize="14" fontWeight="700" fill={lv.c} fontFamily="var(--font-mono)"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + 0.15 * i }}
                    >
                      {lv.l}
                    </motion.text>
                  </g>
                ))}
                {/* Entry marker with pulse */}
                <g transform={`translate(${trade.at * cw + cw / 2} ${y(trade.entry)})`}>
                  <motion.circle r="10" fill="none" stroke="#fff" strokeWidth="2" initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: 3.2, opacity: 0 }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }} />
                  <circle r="7" fill="#b20016" stroke="#fff" strokeWidth="2.5" />
                  <motion.g initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>
                    <rect x="-56" y={trade.side === "BUY" ? 22 : -60} width="112" height="36" rx="10" fill="#b20016" />
                    <text x="0" y={trade.side === "BUY" ? 46 : -36} textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily="var(--font-mono)">{trade.side} · {trade.ind.code}</text>
                  </motion.g>
                </g>
                {/* Target reached */}
                {trade.phase === "hit" && (
                  <g>
                    <motion.rect x="0" width={W} y={y(trade.tp) - 2} height="4" fill="#34c79a" initial={{ opacity: 0.9 }} animate={{ opacity: [0.9, 0.2, 0.9, 0.3] }} transition={{ duration: 1.2 }} filter="url(#hero-glow)" />
                    <motion.text
                      x={W - 300} y={y(trade.tp) - 30} textAnchor="middle" fontSize="34" fontWeight="900" fill="#34c79a" fontFamily="var(--font-mono)"
                      initial={{ opacity: 0, y: 30, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}
                    >
                      +21.25 TP ✓
                    </motion.text>
                  </g>
                )}
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </div>

      {/* Vignettes so the copy stays readable */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(70%_60%_at_15%_40%,rgb(0_0_0/0.85),transparent_70%)] lg:block" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/3 h-[480px] w-[900px] rounded-full bg-brand/25 blur-[140px]" />

      <div className="relative order-1 mx-auto flex w-full max-w-6xl flex-col justify-center px-4 pt-12 pb-2 sm:px-6 lg:flex-1 lg:py-20">
        <div className="max-w-2xl">
          <motion.p
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-line-strong bg-black/50 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-muted uppercase backdrop-blur"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-buy opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-buy" />
            </span>
            ตัวอย่างการทำงาน · ทองคำ XAUUSD · ภาพจำลอง
          </motion.p>

          <h1 className="text-[2.9rem] leading-[1.02] font-black tracking-tight sm:text-7xl lg:text-[5.6rem]">
            {lines.map((ws, l) => (
              <span key={l} className="block">
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
            {/* Slot-machine word that follows the chart */}
            <span className="relative -mt-[0.3em] block h-[1.3em] overflow-hidden pt-[0.3em]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={WORD[phase]}
                  className="absolute left-0 block bg-gradient-to-r from-[#ff3b52] via-[#ff6b7d] to-[#b20016] bg-clip-text whitespace-nowrap text-transparent"
                  initial={{ y: "100%", rotateX: -80, opacity: 0 }}
                  animate={{ y: "0%", rotateX: 0, opacity: 1 }}
                  exit={{ y: "-100%", rotateX: 80, opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  {WORD[phase]}<span className="text-white">.</span>
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <motion.p
            className="mt-6 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }}
          >
            อินดิเคเตอร์ 1SHOT ส่ง Setup พร้อม Entry, SL และ TP ตั้งแต่วินาทีที่เกิดสัญญาณ ตรงจาก TradingView ถึงเว็บและ Telegram ตรวจย้อนได้ทุกจุด
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.8 }}>
            <Link href="/pricing" className="group relative inline-flex h-14 items-center gap-2 overflow-hidden rounded-2xl bg-brand px-7 text-base font-semibold text-white shadow-[0_20px_60px_-15px_rgb(178_0_22/0.9)]">
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">ดูแพ็กเกจ</span>
              <ArrowRight className="relative size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#how" className="inline-flex h-14 items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-7 text-base font-medium text-white backdrop-blur transition-colors hover:bg-white/10">
              ดูการทำงาน
            </a>
          </motion.div>
        </div>

        <Ticket trade={trade} price={last.c} />
      </div>

      <div className="relative order-3">{children}</div>
    </section>
  );
}

const STEPS: { key: Phase; label: string }[] = [{ key: "setup", label: "เกิด Setup" }, { key: "entry", label: "เข้าแล้ว" }, { key: "hit", label: "ถึง TP" }];

/** Glass ticket mirroring the trade on the chart. */
function Ticket({ trade, price }: { trade: Trade | null; price: number }) {
  const order: Record<Phase, number> = { setup: 0, entry: 1, run: 1, hit: 2 };
  const reached = trade ? order[trade.phase] : -1;
  return (
    <motion.div
      className="pointer-events-none absolute right-6 bottom-6 hidden w-80 xl:block"
      initial={{ opacity: 0, x: 60, rotateY: -25 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} transition={{ delay: 1.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1000 }}
    >
      <div className="rounded-3xl border border-white/15 bg-black/55 p-5 shadow-[0_40px_120px_-30px_rgb(178_0_22/0.8)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            <motion.div key={trade?.id ?? "wait"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-3">
              <span className="num grid size-10 place-items-center rounded-xl bg-brand text-xs font-bold text-white">{trade?.ind.code ?? "··"}</span>
              <div>
                <p className="text-sm font-semibold">{trade?.ind.name ?? "รอสัญญาณถัดไป…"}</p>
                <p className="num text-[11px] text-muted">XAUUSD · M5</p>
              </div>
            </motion.div>
          </AnimatePresence>
          {trade && (
            <span className={`num rounded-md px-2 py-0.5 text-[11px] font-bold ${trade.side === "BUY" ? "bg-buy/15 text-buy" : "bg-sell/15 text-sell"}`}>{trade.side}</span>
          )}
        </div>
        <dl className="num mt-5 grid grid-cols-3 gap-2 text-center">
          {[["จุดเข้า", trade?.entry, "text-white"], ["SL", trade?.sl, "text-sell"], ["TP", trade?.tp, "text-buy"]].map(([k, v, c]) => (
            <div key={k as string} className="rounded-xl bg-white/5 py-2.5">
              <dt className="text-[10px] text-faint">{k}</dt>
              <dd className={`mt-0.5 text-sm font-semibold ${c}`}>{typeof v === "number" ? fmt(v) : "—"}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-muted">ราคาตอนนี้</span>
          <span className="num font-semibold">{fmt(price)}</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s.key} className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div className={`h-full ${i === 2 ? "bg-buy" : "bg-brand"}`} initial={false} animate={{ width: i <= reached ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
            </div>
          ))}
        </div>
        <div className="num mt-1.5 grid grid-cols-3 text-[10px] text-faint">
          {STEPS.map((s, i) => <span key={s.key} className={i <= reached ? (i === 2 ? "text-buy" : "text-accent") : ""}>{s.label}</span>)}
        </div>
      </div>
      <AnimatePresence>
        {trade?.phase === "hit" && (
          <motion.div
            className="surface-light mt-3 ml-8 flex items-center gap-3 rounded-2xl bg-panel px-4 py-3 shadow-2xl"
            initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <span className="grid size-9 place-items-center rounded-xl bg-brand text-white"><Send className="size-4" /></span>
            <div>
              <p className="text-sm font-semibold">ถึง TP · ส่งเข้า Telegram แล้ว</p>
              <p className="num text-[11px] text-muted">{trade.ind.code} {trade.side} · +21.25</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
