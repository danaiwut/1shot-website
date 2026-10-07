import { CreditCard, Gift, ShieldCheck } from "lucide-react";
import type { CatalogProduct } from "@/lib/store/catalog";
import { Empty } from "@/components/ui";
import { pairOffers } from "@/lib/store/offers";
import { ProductCard } from "./product-card";

type Props = {
  products: CatalogProduct[];
  access?: Record<string, string | null>;
  subscribed?: string[];
  returning?: boolean;
  from: string;
  /** Show only bundles (homepage teaser). */
  bundlesOnly?: boolean;
};

export function CatalogView({ products, access, subscribed = [], returning, from, bundlesOnly = false }: Props) {
  const deals = products.filter((p) => p.kind === "pick" || (p.kind === "bundle" && (p.badge || p.available_until)));
  const bundles = products.filter((p) => p.kind === "bundle" && !deals.includes(p));
  const singles = products.filter((p) => p.kind === "single");
  if (!products.length) return <Empty title="ยังไม่มีสินค้าเปิดขาย">กำลังเตรียมแพ็กเกจสำหรับคุณ ระหว่างนี้ดูรายละเอียด Indicator และสมัครสมาชิกเพื่อเริ่มใช้ Period Levels ฟรีได้</Empty>;

  return (
    <div className="@container space-y-12">
      {deals.length > 0 && (
        <div id="deals" className="scroll-mt-24">
          <div className="mb-5">
            <h2 className="text-lg font-bold tracking-tight">โปรโมชั่น</h2>
            <p className="text-sm text-muted">ราคาพิเศษช่วงนี้ ซื้อคู่คุ้มกว่าซื้อแยก</p>
          </div>
          <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
            {deals.map((p) => <ProductCard key={p.id} product={p} access={access} subscribed={subscribed.includes(p.id)} returning={returning} from={from} />)}
          </div>
        </div>
      )}
      {bundles.length > 0 && (
        <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
          {bundles.map((p) => <ProductCard key={p.id} product={p} access={access} subscribed={subscribed.includes(p.id)} from={from} />)}
        </div>
      )}
      {!bundlesOnly && singles.length > 0 && (
        <div>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">ซื้อรายตัว</h2>
              <p className="text-sm text-muted">เลือกเฉพาะอินดิเคเตอร์ที่ใช้จริง</p>
            </div>
          </div>
          <div className="grid gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
            {singles.map((p) => <ProductCard key={p.id} product={p} access={access} subscribed={subscribed.includes(p.id)} from={from} variant="single" pairs={pairOffers(products, p.codes[0], returning)} />)}
          </div>
        </div>
      )}
      {!bundlesOnly && <StoreFacts />}
    </div>
  );
}

export function StoreFacts() {
  const facts = [
    { icon: CreditCard, t: "ชำระผ่าน Stripe", d: "บัตรเครดิต/เดบิต และ PromptPay (เฉพาะแบบจ่ายครั้งเดียว) ข้อมูลบัตรไม่ผ่านเว็บเรา" },
    { icon: ShieldCheck, t: "ได้สิทธิ์ทันที", d: "ชำระสำเร็จแล้วสิทธิ์ขึ้นในแดชบอร์ดอัตโนมัติ ซื้อต่ออายุจะบวกเวลาต่อจากของเดิม" },
    { icon: Gift, t: "ฟรีผ่าน Exness IB", d: "เปิดบัญชี Exness ภายใต้ IB ของเรา แล้วกรอกเลขบัญชีในหน้าบัญชี แอดมินจะตรวจและให้สิทธิ์" },
  ];
  return (
    <ul className="grid gap-3 @3xl:grid-cols-3">
      {facts.map((f) => (
        <li key={f.t} className="flex gap-3 rounded-2xl border border-line bg-panel p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-dim text-accent"><f.icon className="size-4" /></span>
          <div>
            <p className="text-sm font-semibold">{f.t}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{f.d}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
