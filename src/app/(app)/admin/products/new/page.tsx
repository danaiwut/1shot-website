import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { ProductForm } from "../forms";

export const metadata = { title: "เพิ่มสินค้า" };

export default async function NewProductPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("indicators").select("code, name").eq("is_reference", false).order("sort");
  return (
    <>
      <Link href="/admin/products" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" /> สินค้าทั้งหมด</Link>
      <PageHeader eyebrow="Admin" title="เพิ่มสินค้า" description="สร้างสินค้าก่อน แล้วเพิ่มราคาในหน้าถัดไป" />
      <Card className="max-w-3xl">
        <CardHeader title="ข้อมูลสินค้า" />
        <ProductForm indicators={(data ?? []) as { code: string; name: string }[]} />
      </Card>
    </>
  );
}
