import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink, Card } from "@/components/ui";

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
      <PageHeader title="คู่มือการใช้งาน" description="ทำตาม 5 หัวข้อนี้ ก็ใช้งาน 1SHOT ได้ครบ" />
      <nav aria-label="สารบัญคู่มือ" className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <a key={s.id} href={`#${s.id}`} className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-4 text-sm font-medium hover:border-fg">
            <span className="num mr-2 text-accent">{String(i + 1).padStart(2, "0")}</span>{s.title}
          </a>
        ))}
      </nav>
      <div className="space-y-4">
        {STEPS.map((s, i) => (
          <Card key={s.id} id={s.id} className="scroll-mt-24 p-5 sm:p-6">
            <h2 className="text-xl font-bold"><span className="num mr-3 text-accent">{String(i + 1).padStart(2, "0")} /</span>{s.title}</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-base">
              {s.body.map((b) => <li key={b}>{b}</li>)}
            </ol>
            <Link href={s.link.href} className="mt-4 inline-flex min-h-11 items-center font-medium text-accent underline underline-offset-4">{s.link.label}</Link>
          </Card>
        ))}
      </div>
      <Card className="mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <LifeBuoy aria-hidden className="mt-0.5 size-6 shrink-0 text-accent" />
          <div>
            <h2 className="font-bold">ยังติดปัญหาอยู่?</h2>
            <p className="text-muted">ติดต่อทีมงานเพื่อขอความช่วยเหลือ</p>
          </div>
        </div>
        <ButtonLink href="/support" className="h-12 px-6">ส่งคำขอรับความช่วยเหลือ</ButtonLink>
      </Card>
    </>
  );
}
