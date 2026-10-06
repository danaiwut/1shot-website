import Image from "next/image";
import { ArrowRight, Rocket } from "lucide-react";
import { ButtonLink } from "@/components/ui";

/** Team photo for the About card (public/images/about.jpg). */
const ABOUT_PHOTO = { src: "/images/about.jpg", alt: "ทีม 1SHOT" };

// Properties of the product, not marketing metrics. The indicator count comes from the DB.
const facts = (indicatorCount: number) => [
  { v: String(indicatorCount), k: "อินดิเคเตอร์บน TradingView" },
  { v: "WF1", k: "มาตรฐานสัญญาณเดียวกันทุกตัว" },
  { v: "2", k: "ช่องทาง เว็บ + Telegram" },
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

export function AboutSection({ indicatorCount, actionHref = "/signup", actionLabel = "สมัครสมาชิกฟรี" }: { indicatorCount: number; actionHref?: string; actionLabel?: string }) {
  return (
    <section id="about" className="surface-dark relative scroll-mt-18 overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_25%_50%,rgb(178_0_22/0.28),transparent_70%)]" />
      <TickRing className="top-10 right-[6%] hidden size-36 text-brand/60 lg:block" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[0.9fr_1fr] lg:gap-16">
        {/* Photo card */}
        <div className="relative mx-auto w-full max-w-md lg:mx-0">
          <TickRing className="-bottom-14 -left-16 size-64 text-brand/50 sm:-left-20 sm:size-72" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-line-strong bg-gradient-to-b from-panel-3 to-panel shadow-[0_40px_100px_-40px_rgb(178_0_22/0.7)]">
                <Image src={ABOUT_PHOTO.src} alt={ABOUT_PHOTO.alt} fill sizes="(min-width: 1024px) 28rem, 90vw" className="object-cover object-[50%_20%]" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(80%_60%_at_80%_100%,rgb(178_0_22/0.35),transparent_70%)] mix-blend-screen" />
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-7">
          <span className="inline-flex rounded-md border border-brand/30 bg-brand-dim px-2.5 py-1 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            เกี่ยวกับ 1SHOT
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
            {facts(indicatorCount).map((f) => (
              <div key={f.k} className="rounded-2xl border border-line bg-panel-2/80 p-3.5 backdrop-blur sm:p-4">
                <dt className="sr-only">{f.k}</dt>
                <dd className="num text-2xl font-semibold sm:text-[1.7rem]">{f.v}</dd>
                <dd className="mt-1 text-xs leading-snug text-muted">{f.k}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div id="how" className="scroll-mt-18 lg:col-span-2">
          <div className="relative overflow-hidden rounded-3xl border border-line-strong bg-panel/80 p-5 shadow-[0_24px_70px_-42px_rgb(178_0_22/0.9)] sm:p-7">
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_130%_at_100%_50%,rgb(178_0_22/0.22),transparent_70%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4 sm:items-center">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/25"><Rocket className="size-5" strokeWidth={1.8} /></span>
                <div>
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">เริ่มใช้งานได้ใน 3 ขั้นตอน</h3>
                  <ol className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
                    {["สมัครสมาชิก", "เลือกแพ็กเกจหรือรับสิทธิ์ผ่าน Exness IB", "เชื่อม Telegram เพื่อรับสัญญาณ"].map((step, index) => (
                      <li key={step} className="flex items-center gap-2 rounded-full border border-line bg-panel-2/70 px-3 py-1.5">
                        <span className="num font-semibold text-accent">{index + 1}</span>{step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              <ButtonLink href={actionHref} className="h-12 w-full shrink-0 px-7 sm:w-auto">
                {actionLabel} <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
