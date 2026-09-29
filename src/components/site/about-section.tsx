import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui";
import { CATALOG } from "@/lib/domain/catalog";

/**
 * Photo for the About card. Put the file in /public (e.g. public/images/about.jpg) and set the path
 * here; while it is null a branded panel is shown instead of a stock person.
 */
const ABOUT_PHOTO: { src: string; alt: string } | null = null;

// Properties of the product, not marketing metrics.
const FACTS = [
  { v: String(CATALOG.length), k: "อินดิเคเตอร์บน TradingView" },
  { v: "4", k: "ขั้นตรวจก่อนส่งสัญญาณ" },
  { v: "100%", k: "Setup มี Entry · SL · TP" },
];

/** Ring of fine radial ticks, like the reference's decorative circles. */
function TickRing({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full animate-ring ${className}`}
      style={{
        background: "repeating-conic-gradient(from 0deg, currentColor 0deg 0.8deg, transparent 0.8deg 3.6deg)",
        WebkitMask: "radial-gradient(circle, transparent 54%, #000 55%, #000 72%, transparent 73%)",
        mask: "radial-gradient(circle, transparent 54%, #000 55%, #000 72%, transparent 73%)",
      }}
    />
  );
}

export function AboutSection() {
  return (
    <section id="about" className="surface-dark relative scroll-mt-18 overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_25%_50%,rgb(178_0_22/0.28),transparent_70%)]" />
      <TickRing className="top-10 right-[6%] hidden size-36 text-brand/60 lg:block" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[0.9fr_1fr] lg:gap-16">
        {/* Photo card */}
        <div className="relative mx-auto w-full max-w-md lg:mx-0">
          <TickRing className="-bottom-14 -left-16 size-64 text-brand/50 sm:-left-20 sm:size-72" />
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl sm:aspect-[4/5] border border-line-strong bg-gradient-to-b from-panel-3 to-panel shadow-[0_40px_100px_-40px_rgb(178_0_22/0.7)]">
            {ABOUT_PHOTO ? (
              <Image src={ABOUT_PHOTO.src} alt={ABOUT_PHOTO.alt} fill sizes="(min-width: 1024px) 28rem, 90vw" className="object-cover" />
            ) : (
              <BrandPanel />
            )}
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-7">
          <span className="inline-flex rounded-md border border-brand/30 bg-brand-dim px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-accent uppercase">
            About 1SHOT
          </span>
          <h2 className="text-3xl leading-[1.15] font-bold tracking-tight text-balance sm:text-[2.6rem]">
            เราสร้างอินดิเคเตอร์ <span className="text-accent">เพื่อเทรดเดอร์ทองคำ</span> โดยเฉพาะ
          </h2>
          <p className="max-w-xl leading-relaxed text-muted">
            1SHOT พัฒนาอินดิเคเตอร์สำหรับ XAUUSD บน TradingView ตั้งแต่ SMC, ICT จนถึง Supply &amp; Demand
            ทุกสัญญาณส่งผ่านมาตรฐาน WF1 เดียวกัน ระบบตรวจทุกฟิลด์ก่อนรับ และแสดงระดับราคาตามที่อินดิเคเตอร์ส่งมาจริง
            ไม่มีใครแก้ตัวเลขย้อนหลัง คุณจึงตรวจสอบผลของทุก Setup ได้ด้วยตัวเอง
          </p>
          <dl className="grid grid-cols-3 gap-2.5 sm:max-w-lg sm:gap-3">
            {FACTS.map((f) => (
              <div key={f.k} className="rounded-2xl border border-line bg-panel-2/80 p-3.5 backdrop-blur sm:p-4">
                <dt className="sr-only">{f.k}</dt>
                <dd className="num text-2xl font-semibold sm:text-[1.7rem]">{f.v}</dd>
                <dd className="mt-1 text-[11px] leading-snug text-muted">{f.k}</dd>
              </div>
            ))}
          </dl>
          <ButtonLink href="/signup" className="h-12 px-7">
            เริ่มใช้งาน <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

/** Placeholder until a real photo is set: logo mark over a faint price chart. */
function BrandPanel() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="grid-bg absolute inset-0 opacity-60 [mask-image:radial-gradient(circle_at_50%_45%,black_20%,transparent_75%)]" />
      <svg viewBox="0 0 400 500" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="about-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--color-brand)" stopOpacity=".45" />
            <stop offset="1" stopColor="var(--color-brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 400 L50 380 L90 395 L140 340 L180 355 L230 290 L270 305 L320 240 L360 255 L400 200 L400 500 L0 500Z" fill="url(#about-area)" />
        <path d="M0 400 L50 380 L90 395 L140 340 L180 355 L230 290 L270 305 L320 240 L360 255 L400 200" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" />
      </svg>
      <div className="relative flex flex-col items-center gap-4 text-center">
        <svg viewBox="0 0 32 32" className="size-24 drop-shadow-[0_20px_40px_rgb(178_0_22/0.6)]" aria-hidden>
          <rect width="32" height="32" rx="8" fill="var(--color-brand)" />
          <path d="M8 21.5 13 16.5l3.5 3.5L24 12" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="12" r="2.2" fill="#fff" />
        </svg>
        <div>
          <p className="text-2xl font-bold tracking-tight">1SHOT</p>
          <p className="mt-1 text-[11px] font-medium tracking-[0.3em] text-muted uppercase">Signals · XAUUSD</p>
        </div>
      </div>
    </div>
  );
}
