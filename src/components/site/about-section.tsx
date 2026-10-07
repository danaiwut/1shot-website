import Image from "next/image";
import { ArrowRight, CandlestickChart, MonitorSmartphone, ShieldCheck } from "lucide-react";
import Link from "next/link";

/*
 * About band: black-and-white portrait over a slanted
 * brand-red block with an oversized "ABOUT" watermark, then the story, three product facts and one action.
 * Follows the selected theme (dark-red / light-red) like the rest of the page.
 */

const PHOTO = { src: "/images/about.jpg", alt: "ผู้ก่อตั้ง 1SHOT" };

export function AboutSection({ indicatorCount = 10, actionHref = "/signup", actionLabel = "สมัครสมาชิกฟรี" }: {
  indicatorCount?: number; actionHref?: string; actionLabel?: string;
}) {
  const facts = [
    { icon: CandlestickChart, v: `${indicatorCount}+`, k: "อินดิเคเตอร์", d: "บน TradingView" },
    { icon: ShieldCheck, v: "WF1", k: "มาตรฐานสัญญาณ", d: "ตรวจทุกฟิลด์ก่อนรับ" },
    { icon: MonitorSmartphone, v: "2", k: "ช่องทาง", d: "เว็บ + Telegram" },
  ];

  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-18 bg-panel">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-16">
        {/* Portrait */}
        <div className="relative mx-auto w-full max-w-md">
          <p aria-hidden className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 text-[7.5rem] leading-none font-black tracking-tighter whitespace-nowrap text-fg/[0.06] select-none sm:text-[9.5rem]">
            ABOUT
          </p>
          <div aria-hidden className="absolute inset-x-[2%] top-[14%] -bottom-[3%] -skew-x-[10deg] bg-brand" />
          <div aria-hidden className="absolute -bottom-3 -left-3 h-1/3 w-1/2 -skew-x-[10deg] bg-black/85 dark:bg-white/15" />
          <div className="relative mx-[16%] aspect-[3/4] overflow-hidden shadow-[0_30px_80px_-30px_rgb(0_0_0/0.55)]">
            <Image
              src={PHOTO.src}
              alt={PHOTO.alt}
              fill
              sizes="(min-width: 1024px) 24rem, 75vw"
              className="object-cover object-[50%_18%] contrast-[1.08] grayscale"
            />
          </div>
          {/* Badge */}
          <div className="absolute top-[18%] -right-1 grid size-28 place-items-center rounded-full border-2 border-fg/80 bg-panel text-center shadow-lg sm:size-32">
            <p>
              <span className="num block text-3xl leading-none font-black text-fg sm:text-4xl">{indicatorCount}+</span>
              <span className="mt-1 block text-xs leading-tight font-semibold text-fg">ระบบเทรด<br />สำหรับทองคำ</span>
            </p>
          </div>
        </div>

        {/* Story */}
        <div>
          <p className="text-sm font-bold tracking-[0.18em] text-accent uppercase">เกี่ยวกับ 1SHOT</p>
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

      {/* Target of the "เริ่มใช้งาน" nav link */}
      <div id="how" className="scroll-mt-18 border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h3 className="text-lg font-bold text-fg">เริ่มใช้งานได้ใน 3 ขั้นตอน</h3>
          <ol className="mt-5 grid gap-4 sm:grid-cols-3">
            {["สมัครสมาชิกและใส่ชื่อผู้ใช้ TradingView", "เลือกแพ็กเกจ หรือรับสิทธิ์ผ่าน Exness IB", "เชื่อม Telegram เพื่อรับสัญญาณ"].map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="num grid size-10 shrink-0 place-items-center rounded-full bg-fg text-sm font-bold text-ink">{i + 1}</span>
                <span className="text-sm font-medium text-fg">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
