import Image from "next/image";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui";

const CREDENTIALS = [
  {
    src: "/images/about/funded-accounts.jpg",
    alt: "บัญชี Funded ของ JR 1SHOT",
    className: "top-[8%] right-[4%] w-[52%] rotate-[2deg]",
  },
  {
    src: "/images/about/funding-pips-ranking.jpg",
    alt: "อันดับผลงาน Funding Pips ของ JR 1SHOT",
    className: "right-[24%] bottom-[8%] w-[45%] -rotate-[3deg]",
  },
  {
    src: "/images/about/funded-trader-certificate.jpg",
    alt: "ใบรับรอง Topstep Funded Trader ของ JR 1SHOT",
    className: "right-[-5%] bottom-[-2%] w-[32%] rotate-[5deg]",
  },
];

export function AboutSection({ actionHref = "/signup", actionLabel = "สมัครสมาชิกฟรี" }: { actionHref?: string; actionLabel?: string }) {
  return (
    <section id="about" className="scroll-mt-18 overflow-hidden bg-[#080809] px-4 py-16 sm:px-6 sm:py-24">
      <div className="relative mx-auto min-h-[680px] max-w-6xl overflow-hidden rounded-[30px] border border-white/10 bg-[#101012] shadow-[0_36px_120px_-48px_rgb(178_0_22/0.9)] sm:min-h-[620px]">
        <div aria-hidden className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(75%_100%_at_75%_45%,rgb(178_0_22/0.2),transparent_72%)]" />
          <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgb(255_255_255/0.08)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.08)_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute inset-y-0 right-0 hidden w-[68%] lg:block">
            {CREDENTIALS.map((image) => (
              <div key={image.src} className={`absolute overflow-hidden rounded-2xl border border-white/15 bg-black/60 shadow-2xl ${image.className}`}>
                <div className="relative aspect-[16/10]">
                  <Image src={image.src} alt="" fill sizes="(min-width: 1024px) 42vw, 1px" className="object-cover" />
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#101012_0%,#101012_42%,rgb(16_16_18/0.88)_58%,rgb(16_16_18/0.28)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#101012] to-transparent" />
        </div>

        <div className="relative flex min-h-[680px] flex-col justify-between p-6 sm:min-h-[620px] sm:p-10 lg:p-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
              <span className="h-px w-10 bg-brand" />
              About the founder
            </div>

            <h2 className="mt-8 text-5xl leading-none font-black tracking-tight text-white sm:text-7xl">JR 1SHOT</h2>
            <p className="mt-4 max-w-xl text-sm font-semibold tracking-[0.06em] text-white/65 sm:text-base">
              Founder · Former Fund Trader · Creator &amp; Developer of 1SHOT Indicators
            </p>

            <div className="mt-8 max-w-2xl space-y-5 text-base leading-8 text-white/72 sm:text-lg">
              <p>
                1SHOT ก่อตั้งและพัฒนาโดย JR 1SHOT อดีตนักเทรดกองทุน และเป็นผู้สร้าง Indicator ทุกระบบของ 1SHOT ด้วยตัวเอง
              </p>
              <p>
                จากประสบการณ์ในตลาดจริง ถูกนำมาพัฒนาเป็นเครื่องมือสำหรับการวิเคราะห์ Market Structure, Liquidity, SMC, ICT, Supply &amp; Demand และ Reversal เพื่อให้แต่ละ Setup มีเหตุผล มีแผน และสามารถนำไปใช้กับการเทรดจริงได้อย่างเป็นระบบ
              </p>
            </div>
          </div>

          <div id="how" className="mt-12 flex flex-col gap-5 border-t border-white/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-3 text-sm text-white/60">
              <BadgeCheck className="size-5 shrink-0 text-accent" />
              ประสบการณ์จริง สู่ระบบวิเคราะห์ที่ตรวจสอบและทบทวนได้
            </p>
            <ButtonLink href={actionHref} className="h-12 w-full shrink-0 px-7 sm:w-auto">
              {actionLabel} <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/10 bg-black/40 p-4 lg:hidden sm:grid-cols-3 sm:p-6">
          {CREDENTIALS.map((image) => (
            <div key={image.src} className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-black">
              <Image src={image.src} alt={image.alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
