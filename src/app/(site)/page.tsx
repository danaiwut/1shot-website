import { ArrowRight, BellRing, Clock3, Layers, Radio, ShieldCheck, Webhook } from "lucide-react";
import { Badge, ButtonLink } from "@/components/ui";
import { PriceLadder } from "@/components/signals/price-ladder";
import { CATALOG } from "@/lib/domain/catalog";

const FLOW = [
  { icon: Webhook, title: "TradingView ส่ง Alert", body: "อินดิเคเตอร์ 1SHOT ยิงข้อความรูปแบบ WF1 ผ่าน Webhook โดยตรง ไม่ต้องผ่านบอทตัวกลาง" },
  { icon: ShieldCheck, title: "ตรวจทุกฟิลด์ก่อนรับ", body: "เช็กลำดับราคา Entry / SL / TP, โหมดเข้า, เวลา และตัวตนของ Setup ข้อความที่ผิดรูปจะถูกปฏิเสธทันที" },
  { icon: Layers, title: "กันซ้ำแบบอะตอมมิก", body: "Event ID เดิมจะไม่ถูกบันทึกซ้ำ และถ้าข้อมูลขัดกับของเดิม ระบบจะปฏิเสธทั้งชุด" },
  { icon: Radio, title: "ขึ้นเว็บและ Telegram", body: "สมาชิกเห็นสถานะ Setup แบบเรียลไทม์ ตั้งแต่รอเข้า → เข้าแล้ว → TP / SL" },
];

const GUARDS = [
  { icon: Clock3, k: "00:00–04:59", v: "ไม่เปิดออเดอร์ใหม่ในช่วงตลาดบาง (เวลาไทย) และยกเลิกคำสั่งที่ค้างอยู่" },
  { icon: ShieldCheck, k: "Daily loss", v: "ประเมินความเสี่ยงรวมของวันก่อนเข้าทุกครั้ง ถ้าไม่มี SL หรืออ่านข้อมูลโบรกเกอร์ไม่ได้ จะไม่เข้า" },
  { icon: Layers, k: "3.00 USD", v: "XAU ต้องห่างจากออเดอร์เดิมอย่างน้อย 3.00 ถึงจะเปิดออเดอร์ใหม่ได้ กันการเข้าซ้อนกันในจุดเดียว" },
  { icon: BellRing, k: "SL ขยับแคบลงเท่านั้น", v: "Setup ใหม่ปรับ SL ได้เฉพาะทิศที่ลดความเสี่ยง ไม่แตะ TP และ Lot เดิม" },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gold/10 blur-[120px]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-20 pb-24 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-28">
          <div className="animate-rise space-y-7">
            <Badge tone="gold" className="px-2.5 py-1 text-xs">
              <span className="size-1.5 rounded-full bg-buy animate-pulse-dot" /> XAUUSD · 10 อินดิเคเตอร์
            </Badge>
            <h1 className="text-4xl leading-[1.15] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.6rem]">
              สัญญาณทองคำ
              <br />
              <span className="gold-text">ที่ตรวจสอบได้ทุกจุด</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted">
              รับ Setup จากอินดิเคเตอร์ 1SHOT ตรงจาก TradingView ทุก Setup มี Entry, SL และ TP ตั้งแต่ตอนเกิดสัญญาณ
              แล้วติดตามได้จนปิดบนเว็บและใน Telegram
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/signup" className="h-11 px-5">
                เริ่มใช้งาน <ArrowRight className="size-4" />
              </ButtonLink>
              <ButtonLink href="#how" variant="outline" className="h-11 px-5">ดูการทำงาน</ButtonLink>
            </div>
          </div>

          {/* Sample ticket — illustrative only */}
          <div className="animate-rise [animation-delay:120ms]">
            <div className="relative rounded-2xl border border-line-strong bg-panel/80 p-1.5 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)] backdrop-blur">
              <div className="rounded-xl border border-line bg-panel-2">
                <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-gold-dim text-xs font-semibold text-gold">AMD</span>
                    <div>
                      <p className="text-sm font-semibold">AMD Pro · Distribution</p>
                      <p className="num text-[11px] text-muted">XAUUSD · M5 · Limit</p>
                    </div>
                  </div>
                  <Badge tone="buy" className="num tracking-wider">BUY</Badge>
                </div>
                <div className="px-5 py-6">
                  <PriceLadder side="BUY" entry={4380.5} sl={4372} tp={4401.75} />
                </div>
                <div className="grid grid-cols-3 border-t border-line text-center text-[11px] text-muted">
                  {["SETUP", "RETEST", "TP"].map((s, i) => (
                    <div key={s} className={`py-3 ${i < 2 ? "border-r border-line" : ""}`}>
                      <span className={i === 0 ? "text-gold" : ""}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="px-3 pt-2 pb-1 text-right text-[10px] text-faint">ภาพตัวอย่างการแสดงผล ไม่ใช่สัญญาณจริง</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-medium tracking-[0.2em] text-gold uppercase">Pipeline</p>
            <h2 className="text-3xl font-semibold tracking-tight">จาก Alert ถึงมือคุณ ภายในไม่กี่วินาที</h2>
            <p className="text-muted">ทุกขั้นตอนตรวจแบบกำหนดตายตัว ไม่มี AI มาแก้ตัวเลข ระดับราคาที่เห็นคือระดับที่อินดิเคเตอร์ส่งมาจริง</p>
          </div>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
            {FLOW.map((f, i) => (
              <li key={f.title} className="relative bg-panel p-6">
                <span className="num absolute top-5 right-5 text-xs text-faint">0{i + 1}</span>
                <f.icon className="size-5 text-gold" strokeWidth={1.6} />
                <h3 className="mt-5 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Indicators */}
      <section id="indicators" className="border-t border-line bg-panel/40">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-medium tracking-[0.2em] text-gold uppercase">Indicators</p>
              <h2 className="text-3xl font-semibold tracking-tight">อินดิเคเตอร์ 10 ตัว ในที่เดียว</h2>
              <p className="text-muted">สิทธิ์แยกตามอินดิเคเตอร์ เลือกดูเฉพาะตัวที่คุณถือสิทธิ์ใน TradingView</p>
            </div>
          </div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {CATALOG.map((ind) => (
              <div key={ind.code} className="group rounded-xl border border-line bg-panel p-5 transition-colors hover:border-gold/40">
                <div className="flex items-center justify-between">
                  <span className="num text-lg font-semibold text-gold">{ind.code}</span>
                  <span className="text-[10px] tracking-wider text-faint uppercase">{ind.family}</span>
                </div>
                <p className="mt-4 text-sm font-semibold">{ind.name}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{ind.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk guard */}
      <section id="guard" className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-3">
            <p className="text-xs font-medium tracking-[0.2em] text-gold uppercase">Risk guard</p>
            <h2 className="text-3xl font-semibold tracking-tight">กติกาความเสี่ยง<br />ที่ทำงานก่อนทุกออเดอร์</h2>
            <p className="text-muted">
              สำหรับบัญชี MT5 ที่เชื่อมระบบเทรดอัตโนมัติ Worker จะตรวจกติกาเหล่านี้ทุกครั้งก่อนส่งคำสั่ง ถ้าเช็กไม่ได้ครบ ระบบจะไม่เข้าออเดอร์
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {GUARDS.map((g) => (
              <div key={g.k} className="rounded-xl border border-line bg-panel p-5">
                <g.icon className="size-4 text-gold" strokeWidth={1.8} />
                <p className="mt-4 text-lg font-semibold">{g.k}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{g.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="join" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-gold/12 via-panel to-panel p-10 sm:p-14">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" />
            <div className="relative max-w-2xl space-y-5">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">พร้อมเริ่มแล้ว?</h2>
              <ol className="space-y-2 text-muted">
                <li><span className="num mr-2 text-gold">1</span>สมัครและยืนยันอีเมล</li>
                <li><span className="num mr-2 text-gold">2</span>ใส่ชื่อผู้ใช้ TradingView และบัญชี Exness ภายใต้ IB</li>
                <li><span className="num mr-2 text-gold">3</span>เชื่อม Telegram เพื่อรับสิทธิ์เข้าห้องสัญญาณ</li>
              </ol>
              <ButtonLink href="/signup" className="h-11 px-5">
                สมัครสมาชิก <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
