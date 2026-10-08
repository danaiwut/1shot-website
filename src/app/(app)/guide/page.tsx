import { ArrowRight, BadgeCheck, LifeBuoy, MessageCircle, RefreshCw, Rocket, Send } from "lucide-react";
import { CARD } from "@/components/app/kit";
import { DarkPanel, Dot } from "@/components/brand";
import { ButtonLink, cx } from "@/components/ui";

export const metadata = { title: "คู่มือการใช้งาน" };

const STEPS = [
  {
    id: "start", icon: Rocket, title: "เริ่มใช้งานครั้งแรก",
    body: ["ยืนยันอีเมลที่ได้รับหลังสมัครสมาชิก", "ไปที่ บัญชีของฉัน แล้วใส่ชื่อผู้ใช้ TradingView ให้ถูกต้อง (ตัวพิมพ์เล็ก-ใหญ่ไม่มีผล)", "เลือกซื้ออินดิเคเตอร์ที่ ร้านค้า หรือกรอกเลขบัญชี Exness ภายใต้ IB เพื่อขอใช้ฟรี"],
    link: { href: "/account", label: "ไปที่บัญชีของฉัน" },
  },
  {
    id: "status", icon: BadgeCheck, title: "อ่านสถานะสิทธิ์",
    body: ["หน้า ภาพรวม บอกว่าใช้งานได้กี่อินดิเคเตอร์ และตัวไหนจะหมดก่อน", "“ใช้งานได้” = เปิดใช้ใน TradingView แล้ว · “ใกล้หมด” = เหลือไม่ถึง 7 วัน · “หมดอายุ” = ต้องต่ออายุ", "สิทธิ์ที่ซื้อผ่านเว็บจะขึ้นทันทีหลังชำระเงิน ส่วนสิทธิ์ผ่าน IB จะขึ้นหลังทีมงานตรวจ"],
    link: { href: "/dashboard", label: "ดูสถานะของฉัน" },
  },
  {
    id: "renew", icon: RefreshCw, title: "ขอสิทธิ์หรือต่ออายุ",
    body: ["กด ต่ออายุ ที่การ์ดอินดิเคเตอร์ หรือเลือกแพ็กเกจที่ ร้านค้า", "ซื้อซ้ำจะบวกวันต่อจากสิทธิ์เดิม ไม่เสียวันที่เหลืออยู่", "ถ้าชำระแล้วแต่สิทธิ์ไม่ขึ้นภายใน 10 นาที ให้ส่งคำขอประเภท “สิทธิ์ 1Shot Indicators”"],
    link: { href: "/store", label: "ไปที่ร้านค้า" },
  },
  {
    id: "room", icon: Send, title: "เข้าห้องสมาชิก",
    body: ["ไปที่ บัญชีของฉัน › Telegram แล้วกด เชื่อม Telegram", "เปิดบอทแล้วกด Start จากนั้นกลับมากด ยืนยันการเชื่อม", "กด ขอเข้าห้อง ข้างอินดิเคเตอร์ที่มีสิทธิ์ ลิงก์ใช้ได้ครั้งเดียวภายใน 10 นาที"],
    link: { href: "/account#telegram", label: "เชื่อม Telegram" },
  },
  {
    id: "problem", icon: LifeBuoy, title: "แจ้งปัญหาการใช้งาน",
    body: ["ไปที่ คำขอและความช่วยเหลือ เลือกประเภทให้ตรงเรื่อง", "บอกรายละเอียด เช่น ชื่อ TradingView วันที่ชำระ หรือภาพหน้าจอที่เห็น", "ทีมงานจะตอบในหน้านั้น สถานะจะเปลี่ยนเป็น “ทีมงานตอบแล้ว”"],
    link: { href: "/support", label: "ส่งคำขอ" },
  },
];

export default function GuidePage() {
  return (
    <div className="space-y-10">
      <DarkPanel as="header" className="px-6 py-9 sm:px-10 sm:py-11">
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-[0.18em] text-accent uppercase">How it works</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">คู่มือการใช้งาน<Dot /></h1>
            <p className="mt-3 max-w-xl text-base text-muted sm:text-lg">ทำตาม {STEPS.length} หัวข้อนี้ ก็ใช้งาน 1SHOT ได้ครบ</p>
          </div>
          <ButtonLink href="/support" variant="outline" className="h-11 rounded-full px-5"><MessageCircle aria-hidden className="size-4" /> ติดต่อทีมงาน</ButtonLink>
        </div>
        <ol aria-label="ขั้นตอนโดยย่อ" className="relative mt-8 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] xl:hidden">
          {STEPS.map((s, i) => (
            <li key={s.id} className="shrink-0">
              <a href={`#${s.id}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-panel/70 pr-4 pl-1.5 text-sm font-medium whitespace-nowrap backdrop-blur hover:border-brand/60">
                <span className="num grid size-7 place-items-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>{s.title}
              </a>
            </li>
          ))}
        </ol>
      </DarkPanel>

      <div className="grid gap-10 xl:grid-cols-[16rem_minmax(0,1fr)] xl:items-start">
        <nav aria-labelledby="guide-toc" className={cx(CARD, "hidden p-4 xl:sticky xl:top-24 xl:block")}>
          <h2 id="guide-toc" className="px-2 pb-2 text-xs font-bold text-muted">สารบัญ</h2>
          <ol className="space-y-0.5">
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm font-medium text-muted outline-none transition-colors hover:bg-panel-2 hover:text-fg focus-visible:ring-[3px] focus-visible:ring-ring/50">
                  <span className="num grid size-7 shrink-0 place-items-center rounded-full bg-panel-3 text-xs font-bold text-fg">{i + 1}</span>{s.title}
                </a>
              </li>
            ))}
            <li>
              <a href="#guide-help" className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm font-medium text-muted hover:bg-panel-2 hover:text-fg">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-dim text-accent"><LifeBuoy aria-hidden className="size-3.5" /></span>ยังติดปัญหา?
              </a>
            </li>
          </ol>
        </nav>

        <div className="space-y-6">
          {STEPS.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className={cx(CARD, "scroll-mt-24 p-5 sm:p-8")}>
              <div className="flex items-start gap-4 sm:gap-5">
                <span aria-hidden className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-[0_10px_30px_-10px_rgb(178_0_22/0.7)] sm:size-14">
                  <s.icon className="size-6" />
                  <span className="num absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-fg text-xs font-bold text-ink ring-2 ring-panel">{i + 1}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-accent">ขั้นที่ {i + 1}</p>
                  <h2 id={`${s.id}-h`} className="mt-1 text-xl font-black tracking-tight sm:text-2xl">{s.title}</h2>
                </div>
              </div>
              <ol className="mt-6 grid gap-3 lg:grid-cols-3">
                {s.body.map((b, j) => (
                  <li key={b} className="flex gap-3 rounded-2xl bg-panel-2 p-4 text-sm leading-relaxed">
                    <span aria-hidden className="num grid size-6 shrink-0 place-items-center rounded-full border border-line-strong text-xs font-bold text-muted">{j + 1}</span>
                    <span className="min-w-0">{b}</span>
                  </li>
                ))}
              </ol>
              <ButtonLink href={s.link.href} variant="outline" className="mt-5 h-11 rounded-full px-5">
                {s.link.label} <ArrowRight aria-hidden className="size-4" />
              </ButtonLink>
            </section>
          ))}

          <section id="guide-help" aria-labelledby="guide-help-h" className="relative scroll-mt-24 overflow-hidden rounded-3xl border border-line bg-ink dark:border-white/10 px-6 py-8 text-fg sm:px-8">
            <div aria-hidden className="pointer-events-none absolute -right-10 -bottom-24 size-72 rounded-full bg-brand/15 dark:bg-brand/40 blur-[100px]" />
            <div className="relative flex flex-wrap items-center justify-between gap-5">
              <div>
                <h2 id="guide-help-h" className="text-2xl font-black tracking-tight">ยังติดปัญหาอยู่?<Dot /></h2>
                <p className="mt-1 text-sm text-muted">ส่งคำขอถึงทีมงาน แล้วติดตามคำตอบได้ในหน้าคำขอ</p>
              </div>
              <ButtonLink href="/support" className="h-11 rounded-full px-6">ส่งคำขอรับความช่วยเหลือ <ArrowRight aria-hidden className="size-4" /></ButtonLink>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
