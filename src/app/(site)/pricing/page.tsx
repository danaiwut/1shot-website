import { CatalogView } from "@/components/store/catalog-view";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { loadCatalog, loadOwnership } from "@/lib/store/catalog";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "ราคาและแพ็กเกจ" };

export default async function PricingPage() {
  const supabase = isSupabaseConfigured() ? await createClient() : null;
  const [products, viewer] = supabase ? await Promise.all([loadCatalog(supabase), getViewer()]) : [[], null];
  const owned = viewer && supabase ? await loadOwnership(supabase, viewer.userId) : undefined;

  return (
    <main id="main" tabIndex={-1} className="outline-none">
      <section className="store-hero relative overflow-hidden border-b border-line">

        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-14 text-center sm:px-6 sm:pt-20">
          <p className="eyebrow">แพ็กเกจและราคา</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            เลือกแพ็กเกจที่ใช่<span className="text-accent">.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">
            ซื้อรายตัวหรือแพ็กเกจรวม จ่ายรายเดือนหรือครั้งเดียว ชำระสำเร็จแล้วได้สิทธิ์ใช้อินดิเคเตอร์และห้องสัญญาณทันที
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <CatalogView products={products} access={owned?.access} subscribed={owned?.subscribed} returning={owned?.returning} from="/pricing" />
      </section>
      <section className="mx-auto max-w-3xl px-5 pb-20">
        <p className="eyebrow">ก่อนเริ่มใช้งาน</p><h2 className="mt-3 mb-7 text-2xl font-semibold">ข้อมูลก่อนเลือกซื้อ</h2>
        {[
          ["ซื้อแล้วตรวจสอบสิทธิ์ได้ที่ไหน?", "ดูรายการ Indicator และวันหมดอายุได้ที่แดชบอร์ด ส่วนประวัติคำสั่งซื้อและรายการชำระเงินอยู่ในหน้าการชำระเงิน"],
          ["รายเดือนกับจ่ายครั้งเดียวต่างกันอย่างไร?", "แบบสมัครสมาชิกจะตัดเงินตามรอบที่เลือก และจัดการการต่ออายุได้ในหน้าการชำระเงิน ส่วนแบบจ่ายครั้งเดียวจะได้สิทธิ์ตามระยะเวลาที่ระบุบนสินค้า"],
          ["ต้องเตรียมข้อมูลอะไรบ้าง?", "กรอกชื่อผู้ใช้ TradingView ในหน้าบัญชี และเชื่อม Telegram หากต้องการเข้าห้องสัญญาณ หากขอสิทธิ์ผ่าน Exness IB ให้กรอกเลขบัญชีและรอผู้ดูแลตรวจสอบ"],
        ].map(([question, answer]) => <details key={question} className="group border-b border-line py-5"><summary className="cursor-pointer text-sm font-medium marker:text-accent">{question}</summary><p className="mt-3 pl-4 text-sm leading-7 text-muted">{answer}</p></details>)}
      </section>
    </main>
  );
}
