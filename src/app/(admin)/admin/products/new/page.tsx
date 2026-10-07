import { BackLink, SettingsSection } from "@/components/app/kit";
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
      <PageHeader title="เพิ่มสินค้า" description="สร้างสินค้าก่อน แล้วเพิ่มราคาในหน้าถัดไป" />
      <SettingsSection title="ข้อมูลสินค้า" description="ชื่อ ประเภท และอินดิเคเตอร์ที่ลูกค้าจะได้รับ">
        <ProductForm indicators={(data ?? []) as { code: string; name: string }[]} />
      </SettingsSection>
    </>
  );
}
