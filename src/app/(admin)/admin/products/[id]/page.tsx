import { notFound } from "next/navigation";
import { BackLink, SettingsSection, StatRow } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtTHB, kindLabel } from "@/lib/store/pricing";
import type { Product } from "@/lib/types";
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
        title={product.name}
        description={`${kindLabel(product)} · ${product.codes.join(" · ") || "ไม่มีอินดิเคเตอร์"}`}
        action={<ButtonLink href="/pricing" target="_blank" variant="outline">ดูหน้าราคา<span className="sr-only"> (เปิดแท็บใหม่)</span></ButtonLink>}
      />
      <div className="space-y-10">
        <StatRow
          items={[
            { label: "สถานะ", value: product.active ? "เปิดขาย" : "ปิดขาย" },
            { label: "ราคาที่เปิดขาย", value: `${activePrices} / ${prices.length}` },
            { label: "ขายแล้ว", value: `${sold.length} รายการ` },
            { label: "รายได้", value: fmtTHB(revenue) },
          ]}
        />
        <div>
          <SettingsSection title="ข้อมูลสินค้า" description="ชื่อ ประเภท และอินดิเคเตอร์ที่ลูกค้าจะได้รับ">
            <ProductForm product={product} indicators={(indicators ?? []) as { code: string; name: string }[]} />
          </SettingsSection>
          <SettingsSection title="ราคา" description="แก้ราคาไม่กระทบคนที่ซื้อไปแล้ว ถ้าจะเปลี่ยนราคา ให้เพิ่มราคาใหม่แล้วปิดขายราคาเก่า">
            <PriceList productId={product.id} prices={prices} />
            <AddPriceForm productId={product.id} kind={product.kind} />
          </SettingsSection>
        </div>
      </div>
    </>
  );
}
