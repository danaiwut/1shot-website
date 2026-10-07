import { TextLink } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui";

export const metadata = { title: "คู่มือการใช้งาน" };

const STEPS = [
  {
    id: "start", title: "เริ่มใช้งานครั้งแรก",
    body: ["ยืนยันอีเมลที่ได้รับหลังสมัครสมาชิก", "ไปที่ บัญชีของฉัน แล้วใส่ชื่อผู้ใช้ TradingView ให้ถูกต้อง (ตัวพิมพ์เล็ก-ใหญ่ไม่มีผล)", "เลือกซื้ออินดิเคเตอร์ที่ ร้านค้า หรือกรอกเลขบัญชี Exness ภายใต้ IB เพื่อขอใช้ฟรี"],
    link: { href: "/account", label: "ไปที่บัญชีของฉัน" },
  },
  {
    id: "status", title: "อ่านสถานะสิทธิ์",
    body: ["หน้า ภาพรวม บอกว่าใช้งานได้กี่อินดิเคเตอร์ และตัวไหนจะหมดก่อน", "“ใช้งานได้” = เปิดใช้ใน TradingView แล้ว · “ใกล้หมด” = เหลือไม่ถึง 7 วัน · “หมดอายุ” = ต้องต่ออายุ", "สิทธิ์ที่ซื้อผ่านเว็บจะขึ้นทันทีหลังชำระเงิน ส่วนสิทธิ์ผ่าน IB จะขึ้นหลังทีมงานตรวจ"],
    link: { href: "/dashboard", label: "ดูสถานะของฉัน" },
  },
  {
    id: "renew", title: "ขอสิทธิ์หรือต่ออายุ",
    body: ["กด ต่ออายุ ที่การ์ดอินดิเคเตอร์ หรือเลือกแพ็กเกจที่ ร้านค้า", "ซื้อซ้ำจะบวกวันต่อจากสิทธิ์เดิม ไม่เสียวันที่เหลืออยู่", "ถ้าชำระแล้วแต่สิทธิ์ไม่ขึ้นภายใน 10 นาที ให้ส่งคำขอประเภท “สิทธิ์ 1Shot Indicators”"],
    link: { href: "/store", label: "ไปที่ร้านค้า" },
  },
  {
    id: "room", title: "เข้าห้องสมาชิก",
    body: ["ไปที่ บัญชีของฉัน › Telegram แล้วกด เชื่อม Telegram", "เปิดบอทแล้วกด Start จากนั้นกลับมากด ยืนยันการเชื่อม", "กด ขอเข้าห้อง ข้างอินดิเคเตอร์ที่มีสิทธิ์ ลิงก์ใช้ได้ครั้งเดียวภายใน 10 นาที"],
    link: { href: "/account#telegram", label: "เชื่อม Telegram" },
  },
  {
    id: "problem", title: "แจ้งปัญหาการใช้งาน",
    body: ["ไปที่ คำขอและความช่วยเหลือ เลือกประเภทให้ตรงเรื่อง", "บอกรายละเอียด เช่น ชื่อ TradingView วันที่ชำระ หรือภาพหน้าจอที่เห็น", "ทีมงานจะตอบในหน้านั้น สถานะจะเปลี่ยนเป็น “ทีมงานตอบแล้ว”"],
    link: { href: "/support", label: "ส่งคำขอ" },
  },
];

export default function GuidePage() {
  return (
    <>
      <PageHeader
        title="คู่มือการใช้งาน"
        description="ทำตาม 5 หัวข้อนี้ ก็ใช้งาน 1SHOT ได้ครบ"
        action={<ButtonLink href="/support" variant="outline">ติดต่อทีมงาน</ButtonLink>}
      />
      <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
        <nav aria-labelledby="guide-toc" className="lg:sticky lg:top-24">
          <h2 id="guide-toc" className="mb-2 text-sm font-semibold text-muted">สารบัญ</h2>
          <ol className="border-l border-line">
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px flex min-h-11 items-center gap-2 border-l border-transparent pl-3 text-sm text-muted outline-none hover:border-fg hover:text-fg focus-visible:ring-[3px] focus-visible:ring-ring/50">
                  <span className="num tabular-nums text-faint">{i + 1}.</span> {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="max-w-2xl space-y-10">
          {STEPS.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-24">
              <h2 id={`${s.id}-h`} className="text-base font-semibold">
                <span className="num mr-2 tabular-nums text-muted">{i + 1}.</span>{s.title}
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed marker:text-muted">
                {s.body.map((b) => <li key={b} className="pl-1">{b}</li>)}
              </ol>
              <TextLink href={s.link.href} className="mt-1">{s.link.label} <span aria-hidden>→</span></TextLink>
            </section>
          ))}

          <section aria-labelledby="guide-help" className="border-t border-line pt-8">
            <h2 id="guide-help" className="text-base font-semibold">ยังติดปัญหาอยู่?</h2>
            <p className="mt-1 text-sm text-muted">ส่งคำขอถึงทีมงาน แล้วติดตามคำตอบได้ในหน้าคำขอ</p>
            <TextLink href="/support">ส่งคำขอรับความช่วยเหลือ <span aria-hidden>→</span></TextLink>
          </section>
        </article>
      </div>
    </>
  );
}
