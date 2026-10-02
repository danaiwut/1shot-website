"use client";
import { useReduce } from "./use-reduce";
import { useRef, useState } from "react";
import { Layers, Radio, ShieldCheck, Webhook } from "lucide-react";
import {
  AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform,
} from "motion/react";

const STEPS = [
  { icon: Webhook, title: "TradingView ส่ง Alert", body: "อินดิเคเตอร์ 1SHOT ยิงข้อความรูปแบบ WF1 ผ่าน Webhook โดยตรง ไม่ต้องผ่านบอทตัวกลาง" },
  { icon: ShieldCheck, title: "ตรวจทุกฟิลด์ก่อนรับ", body: "เช็กลำดับราคา Entry / SL / TP, โหมดเข้า, เวลา และตัวตนของ Setup ข้อความที่ผิดรูปจะถูกปฏิเสธทันที" },
  { icon: Layers, title: "กันซ้ำแบบอะตอมมิก", body: "Event ID เดิมจะไม่ถูกบันทึกซ้ำ และถ้าข้อมูลขัดกับของเดิม ระบบจะปฏิเสธทั้งชุด" },
  { icon: Radio, title: "ขึ้นเว็บและ Telegram", body: "สมาชิกเห็นสถานะ Setup แบบเรียลไทม์ ตั้งแต่รอเข้า → เข้าแล้ว → TP / SL" },
];

// Illustrative price path (viewBox 0 0 600 360): dips into the entry zone, then runs to the target.
const PATH = "M0 250 L40 238 L70 262 L110 220 L150 236 L190 212 L230 248 L262 270 L300 252 L340 214 L380 196 L420 160 L460 172 L500 118 L540 96 L600 64";
const ENTRY_Y = 252, SL_Y = 300, TP_Y = 80;

/** Pinned scroll scene: the chart draws as you scroll while the four pipeline steps take turns. */
export function ScrollPipeline() {
  const reduce = useReduce();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const [step, setStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length * 0.999))));

  const draw = useTransform(progress, [0.05, 0.95], [0, 1]);
  const levels = useTransform(progress, [0.22, 0.4], [0, 1]);
  const tpHit = useTransform(progress, [0.88, 0.96], [0, 1]);
  const bigY = useTransform(progress, [0, 1], ["10%", "-10%"]);

  if (reduce) return <StaticPipeline />;

  return (
    <section ref={ref} id="how" className="surface-dark relative h-[420vh] scroll-mt-18 bg-ink">
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
        <div className="brand-glow pointer-events-none absolute inset-0 opacity-60" />
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <motion.div className="absolute inset-x-0 top-0 z-10 h-1 origin-left bg-brand" style={{ scaleX: progress }} />

        {/* Giant step number behind everything */}
        <motion.div aria-hidden className="pointer-events-none absolute -right-[4vw] bottom-0 select-none" style={{ y: bigY }}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={step}
              className="num block text-[44vw] leading-[0.8] font-bold text-transparent [-webkit-text-stroke:2px_rgb(178_0_22/0.45)] lg:text-[30vw]"
              initial={{ y: "40%", opacity: 0, rotate: 8 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: "-40%", opacity: 0, rotate: -8 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              0{step + 1}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <div className="relative mx-auto grid w-full max-w-6xl flex-1 content-center gap-5 px-4 pt-20 pb-6 sm:gap-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="eyebrow">ขั้นตอนการทำงาน</p>
              <h2 className="text-2xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl">
                จาก Alert ถึงมือคุณ<br />ในไม่กี่วินาที<span className="text-accent">.</span>
              </h2>
            </div>
            <div className="relative min-h-36 sm:min-h-40">
              <AnimatePresence mode="wait">
                {STEPS.map((s, i) => i === step && (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="flex gap-4"
                  >
                    <motion.span
                      className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-[0_0_40px_rgb(178_0_22/0.6)]"
                      initial={{ rotate: -45, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <s.icon className="size-6" strokeWidth={1.8} />
                    </motion.span>
                    <div>
                      <p className="num text-sm font-semibold text-accent">ขั้นที่ 0{i + 1} / 04</p>
                      <h3 className="mt-1 text-xl font-bold sm:text-2xl">{s.title}</h3>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted sm:text-base">{s.body}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <ol className="flex gap-2">
              {STEPS.map((s, i) => (
                <li key={s.title} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-strong">
                  <motion.div className="h-full bg-brand" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
                </li>
              ))}
            </ol>
          </div>

          {/* Chart that draws itself */}
          <div className="relative rounded-3xl border border-line-strong bg-panel/70 p-4 backdrop-blur sm:p-6">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="num font-semibold">XAUUSD · M5</span>
              <span className="text-faint">ภาพตัวอย่าง</span>
            </div>
            <svg viewBox="0 0 600 360" className="mx-auto h-auto max-h-[30svh] w-full overflow-visible lg:max-h-none" aria-hidden>
              <defs>
                <linearGradient id="pipe-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#b20016" stopOpacity=".35" />
                  <stop offset="1" stopColor="#b20016" stopOpacity="0" />
                </linearGradient>
                <filter id="pipe-glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>
              {[60, 140, 220, 300].map((y) => <line key={y} x1="0" x2="600" y1={y} y2={y} stroke="rgb(255 255 255 / .06)" />)}

              {/* Entry / SL / TP levels */}
              {[
                { y: TP_Y, c: "#34c79a", l: "TP 4,401.75", left: true },
                { y: ENTRY_Y, c: "#ffffff", l: "จุดเข้า 4,380.50", left: false },
                { y: SL_Y, c: "#ff4d61", l: "SL 4,372.00", left: false },
              ].map((lv) => (
                <g key={lv.l}>
                  <motion.line x1="0" x2="600" y1={lv.y} y2={lv.y} stroke={lv.c} strokeWidth="1.5" strokeDasharray="6 6" style={{ pathLength: levels, opacity: levels }} />
                  <motion.text x={lv.left ? 4 : 596} y={lv.y - 8} textAnchor={lv.left ? "start" : "end"} fontSize="13" fill={lv.c} fontFamily="var(--font-mono)" style={{ opacity: levels }}>{lv.l}</motion.text>
                </g>
              ))}
              <motion.rect x="240" y={ENTRY_Y - 14} width="90" height="28" rx="6" fill="rgb(255 255 255 / .08)" stroke="rgb(255 255 255 / .3)" style={{ opacity: levels }} />

              <motion.path d={`${PATH} L600 360 L0 360 Z`} fill="url(#pipe-fill)" style={{ opacity: draw }} />
              <motion.path d={PATH} fill="none" stroke="#ff4d61" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#pipe-glow)" style={{ pathLength: draw }} />

              {/* Target reached */}
              <motion.g style={{ opacity: tpHit, scale: tpHit, originX: "540px", originY: `${TP_Y}px` }}>
                <circle cx="540" cy={TP_Y + 16} r="26" fill="#34c79a" fillOpacity=".18" stroke="#34c79a" />
                <text x="540" y={TP_Y + 21} textAnchor="middle" fontSize="14" fontWeight="700" fill="#34c79a">TP ✓</text>
              </motion.g>
            </svg>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[10px] sm:text-[11px]">
              {["รับ Alert", "ตรวจสอบ", "กันซ้ำ", "ส่งถึงคุณ"].map((t, i) => (
                <motion.span
                  key={t}
                  animate={{ backgroundColor: i <= step ? "rgba(178,0,22,1)" : "rgba(255,255,255,0.06)", color: i <= step ? "#fff" : "#a6a6a6" }}
                  className="num rounded-lg py-1.5 font-semibold"
                >
                  {t}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
        <p className="relative pb-6 text-center text-[11px] text-faint">เลื่อนลงเพื่อดูแต่ละขั้น</p>
      </div>
    </section>
  );
}

/** Reduced-motion version: the four steps as a plain grid. */
function StaticPipeline() {
  return (
    <section id="how" className="scroll-mt-18">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-10 rounded-[28px] bg-brand-dim p-6 sm:p-12 lg:grid-cols-[0.8fr_2fr] lg:items-center">
          <div className="space-y-3">
            <p className="eyebrow">ขั้นตอนการทำงาน</p>
            <h2 className="text-3xl leading-tight font-bold tracking-tight">จาก Alert ถึงมือคุณ<br />ในไม่กี่วินาที<span className="text-accent">.</span></h2>
          </div>
          <ol className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="grid size-12 place-items-center rounded-full bg-brand text-white"><s.icon className="size-5" /></span>
                <p className="num mt-5 text-xl font-semibold text-accent">0{i + 1}</p>
                <h3 className="mt-1 font-semibold">{s.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
