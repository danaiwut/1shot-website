import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, ButtonLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtTHB } from "@/lib/store/pricing";
import type { Product } from "@/lib/types";
import { BackLink, InfoRow, Panel } from "../../_components/admin-ui";
import { AddPriceForm, PriceList, ProductForm } from "../forms";

export const metadata = { title: "แก้ไขสินค้า" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const { supabase } = await requireStaff();
  const [{ data: product }, { data: indicators }, { data: orders }] = await Promise.all([
    supabase.from("products").select("*, product_prices(*)").eq("id", id).maybeSingle<Product>(),
    supabase.from("indicators").select("code, name").eq("is_reference", false).order("sort"),
    supabase.from("orders").select("amount_satang").eq("product_id", id).eq("status", "paid"),
  ]);
  if (!product) notFound();
  const prices = [...(product.product_prices ?? [])].sort((a, b) => a.sort - b.sort || a.amount_satang - b.amount_satang);
  const sold = (orders ?? []) as { amount_satang: number }[];

  const revenue = sold.reduce((s, o) => s + o.amount_satang, 0);
  const activePrices = prices.filter((p) => p.active).length;

  return (
    <>
      <BackLink href="/admin/products">สินค้าทั้งหมด</BackLink>
      <PageHeader
        eyebrow="ผู้ดูแลระบบ · สินค้า"
        title={product.name}
        description={`ขายแล้ว ${sold.length} รายการ · รายได้ ${fmtTHB(revenue)}`}
        action={<ButtonLink href="/pricing" target="_blank" variant="outline">ดูหน้าราคา <ExternalLink aria-hidden className="size-4" /><span className="sr-only"> (เปิดแท็บใหม่)</span></ButtonLink>}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Panel title="ข้อมูลสินค้า" description="ชื่อ ประเภท และอินดิเคเตอร์ที่ลูกค้าจะได้รับ">
            <ProductForm product={product} indicators={(indicators ?? []) as { code: string; name: string }[]} />
          </Panel>
        </div>
        <div className="min-w-0 space-y-6">
          <Panel title="สรุป">
            <dl className="divide-y divide-line">
              <InfoRow k="สถานะ"><Badge tone={product.active ? "buy" : "sell"}>{product.active ? "เปิดขาย" : "ปิดขาย"}</Badge></InfoRow>
              <InfoRow k="ประเภท">{product.kind === "bundle" ? "แพ็กเกจรวม" : "รายตัว"}</InfoRow>
              <InfoRow k="อินดิเคเตอร์"><span className="num">{product.codes.join(" · ") || "—"}</span></InfoRow>
              <InfoRow k="ราคาที่เปิดขาย"><span className="num">{activePrices} / {prices.length}</span></InfoRow>
              <InfoRow k="ขายแล้ว"><span className="num">{sold.length} รายการ</span></InfoRow>
              <InfoRow k="รายได้"><span className="num font-semibold">{fmtTHB(revenue)}</span></InfoRow>
            </dl>
          </Panel>
          <Panel title="ราคา" description="แก้ราคาไม่กระทบคนที่ซื้อไปแล้ว ถ้าจะเปลี่ยนราคา ให้เพิ่มราคาใหม่แล้วปิดขายราคาเก่า">
            <PriceList productId={product.id} prices={prices} />
            <AddPriceForm productId={product.id} />
          </Panel>
        </div>
      </div>
    </>
  );
}
