import { BackLink } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { requireStaff } from "@/lib/auth";
import { ProductForm } from "../forms";

export const metadata = { title: "เพิ่มสินค้า" };

export default async function NewProductPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("indicators").select("code, name").eq("is_reference", false).order("sort");
  return (
    <>
      <BackLink href="/admin/products">สินค้าทั้งหมด</BackLink>
      <PageHeader title="เพิ่มสินค้า" description="ทำตาม 4 ขั้น ดูตัวอย่างการ์ดได้ระหว่างกรอก แล้วตั้งราคาในหน้าถัดไป" />
      <ProductForm indicators={(data ?? []) as { code: string; name: string }[]} />
    </>
  );
}
