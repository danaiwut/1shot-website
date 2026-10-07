import { ArrowRight, Check } from "lucide-react";
import { ButtonLink } from "@/components/ui";

const PRINCIPLES = [
  { n: "01", title: "มีแผนก่อนเข้า", text: "ระบุ Entry, Stop Loss และ Take Profit ใน Setup เดียว" },
  { n: "02", title: "ใช้มาตรฐานเดียวกัน", text: "ข้อมูลทุกสัญญาณผ่านรูปแบบ WF1 ที่ตรวจสอบได้" },
  { n: "03", title: "ย้อนทบทวนได้", text: "ติดตาม Setup เพื่อใช้พัฒนาวินัยและการตัดสินใจ" },
];

export function AboutSection({ actionHref = "/signup", actionLabel = "สมัครสมาชิกฟรี" }: { actionHref?: string; actionLabel?: string }) {
  return (
    <section id="about" className="scroll-mt-18 bg-[#09090b] px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#111114] shadow-[0_32px_100px_-45px_rgb(178_0_22/0.8)]">
        <div className="relative overflow-hidden border-b border-white/10 px-6 py-5 sm:px-9">
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(110deg,rgb(178_0_22/0.3),transparent_55%)]" />
          <div className="relative flex items-center justify-between gap-4 text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">
            <span>1SHOT · Trading Framework</span>
            <span className="hidden text-accent sm:block">Every Setup. Verified.</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative min-h-80 overflow-hidden bg-[#171719] p-7 sm:p-10">
            <div aria-hidden className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgb(255_255_255/0.08)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.08)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div aria-hidden className="absolute -right-16 -bottom-24 text-[13rem] leading-none font-black tracking-tighter text-brand/30">WF1</div>
            <div aria-hidden className="absolute top-10 right-0 h-px w-3/4 bg-brand" />
            <div aria-hidden className="absolute top-10 right-[23%] size-2 -translate-y-1/2 rounded-full bg-brand shadow-[0_0_18px_rgb(178_0_22)]" />
            <div className="relative flex h-full flex-col justify-between">
              <span className="inline-flex w-fit border border-white/20 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/80 uppercase">ระบบของเรา</span>
              <div>
                <p className="text-sm text-white/55">Framework สำหรับการวางแผนเทรดทองคำ</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">อ่านตลาด<br /><span className="text-accent">อย่างมีเหตุผล</span></p>
              </div>
            </div>
          </div>

          <div className="bg-white p-7 text-zinc-950 sm:p-10 lg:p-12">
            <p className="text-xs font-bold tracking-[0.18em] text-brand uppercase">About 1SHOT</p>
            <h2 className="mt-4 max-w-xl text-3xl leading-[1.12] font-black tracking-tight sm:text-5xl">
              ทุก Setup ถูกออกแบบ<br className="hidden sm:block" /> เพื่อให้ตัดสินใจได้ชัดเจน
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-600">
              1SHOT เปลี่ยนข้อมูลจากอินดิเคเตอร์ให้เป็นแผนที่อ่านง่าย เพื่อให้คุณเห็นจุดเข้า จุดป้องกันความเสี่ยง และเป้าหมายก่อนตัดสินใจเทรด
            </p>

            <div className="mt-8 grid gap-4 border-t border-zinc-200 pt-6 sm:grid-cols-3">
              {PRINCIPLES.map((principle) => (
                <div key={principle.n} className="border-l-2 border-brand pl-4">
                  <span className="num text-xs font-bold text-brand">{principle.n}</span>
                  <h3 className="mt-1 font-bold">{principle.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">{principle.text}</p>
                </div>
              ))}
            </div>

            <div id="how" className="mt-9 flex flex-col gap-4 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm font-medium text-zinc-600"><Check className="size-4 text-brand" /> เริ่มใช้งานได้ใน 3 ขั้นตอน</p>
              <ButtonLink href={actionHref} className="h-12 w-full px-6 sm:w-auto">
                {actionLabel} <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
