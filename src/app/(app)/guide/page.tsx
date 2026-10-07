import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
        action={<ButtonLink href="/support" variant="outline"><LifeBuoy aria-hidden className="size-4" /> ติดต่อทีมงาน</ButtonLink>}
      />
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
        <nav aria-label="สารบัญคู่มือ" className="lg:sticky lg:top-24">
          <Card className="gap-0 rounded-2xl p-2 shadow-xs">
            <p aria-hidden className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted">สารบัญ</p>
            <ol className="grid gap-0.5 sm:grid-cols-2 lg:grid-cols-1">
              {STEPS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none hover:bg-panel-2 focus-visible:ring-[3px] focus-visible:ring-ring/50">
                    <span className="num grid size-6 shrink-0 place-items-center rounded-md bg-brand-dim text-xs font-bold text-accent">{i + 1}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </Card>
        </nav>

        <div className="space-y-6">
          {STEPS.map((s, i) => (
            <Card key={s.id} id={s.id} className="scroll-mt-24 gap-0 rounded-2xl py-0 shadow-xs">
              <CardHeader className="border-b border-line py-5">
                <CardDescription className="num text-xs font-semibold tracking-[0.14em] text-accent">ขั้นที่ {String(i + 1).padStart(2, "0")}</CardDescription>
                <CardTitle><h2 className="text-lg leading-snug font-bold">{s.title}</h2></CardTitle>
              </CardHeader>
              <CardContent className="py-5">
                <ol className="space-y-3">
                  {s.body.map((b, j) => (
                    <li key={b} className="flex gap-3">
                      <span aria-hidden className="num mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-line-strong text-xs font-semibold text-muted">{j + 1}</span>
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
              <CardFooter className="border-t border-line bg-panel-2/40 py-3">
                <Link href={s.link.href} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent underline underline-offset-4">{s.link.label} <ArrowRight aria-hidden className="size-4" /></Link>
              </CardFooter>
            </Card>
          ))}

          <Card className="flex-row flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-t from-brand-dim/40 to-panel px-6 py-5 shadow-xs">
            <div className="flex items-start gap-3">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-dim text-accent"><LifeBuoy className="size-5" /></span>
              <div>
                <h2 className="font-bold">ยังติดปัญหาอยู่?</h2>
                <p className="text-sm text-muted">ติดต่อทีมงานเพื่อขอความช่วยเหลือ</p>
              </div>
            </div>
            <ButtonLink href="/support" className="w-full sm:w-auto">ส่งคำขอรับความช่วยเหลือ</ButtonLink>
          </Card>
        </div>
      </div>
    </>
  );
}
