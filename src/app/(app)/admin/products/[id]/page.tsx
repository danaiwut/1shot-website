import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtTHB } from "@/lib/store/pricing";
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

  return (
    <>
      <Link href="/admin/products" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" /> สินค้าทั้งหมด</Link>
      <PageHeader
        eyebrow="ผู้ดูแลระบบ · สินค้า"
        title={product.name}
        description={`ขายแล้ว ${sold.length} รายการ · รายได้ ${fmtTHB(sold.reduce((s, o) => s + o.amount_satang, 0))}`}
        action={<Link href="/pricing" target="_blank" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">ดูหน้าราคา <ExternalLink className="size-3.5" /></Link>}
      />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader title="ข้อมูลสินค้า" />
          <ProductForm product={product} indicators={(indicators ?? []) as { code: string; name: string }[]} />
        </Card>
        <Card className="self-start">
          <CardHeader title="ราคา" hint="แก้ราคาไม่กระทบคนที่ซื้อไปแล้ว ถ้าจะเปลี่ยนราคา ให้เพิ่มราคาใหม่แล้วปิดขายราคาเก่า" />
          <PriceList productId={product.id} prices={prices} />
          <AddPriceForm productId={product.id} />
        </Card>
      </div>
    </>
  );
}
