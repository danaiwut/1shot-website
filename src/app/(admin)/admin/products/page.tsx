import Link from "next/link";
import { EmptyLine, Section, Status, TableBox, Td, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { Badge, ButtonLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { SalesTabs } from "../_components/sales-tabs";
import { fmtDate } from "@/lib/format";
import { fmtTHB, kindLabel, priceSuffix } from "@/lib/store/pricing";
import type { Product } from "@/lib/types";

export const metadata = { title: "ราคาและโปร" };

export default async function ProductsPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("products").select("*, product_prices(*)").order("sort");
  const products = (data ?? []) as Product[];

  return (
    <>
      <PageHeader
        title="ราคาและโปร"
        description="เพิ่มสินค้า แล้วใส่ราคา ลูกค้าจะเห็นในร้านค้าทันที"
        action={<ButtonLink href="/admin/products/new">เพิ่มสินค้าหรือโปร</ButtonLink>}
      />
      <SalesTabs on="products" />
      <Section title="สินค้าทั้งหมด" description={`${products.length} รายการ · เปิดขาย ${products.filter((p) => p.active).length}`}>
        {products.length ? (
          <TableBox caption="สินค้าและราคา" minWidth={720}>
            <thead className="bg-panel-2">
              <tr>
                <Th>สินค้า</Th>
                <Th>อินดิเคเตอร์</Th>
                <Th>ราคาที่เปิดขาย</Th>
                <Th>สถานะ</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const prices = (p.product_prices ?? []).filter((x) => x.active).sort((a, b) => a.amount_satang - b.amount_satang);
                return (
                  <tr key={p.id} className="border-t border-line">
                    <Td>
                      <Link href={`/admin/products/${p.id}`} className="group inline-flex min-h-11 flex-col justify-center">
                        <span className="block font-medium group-hover:text-accent group-hover:underline">{p.name}</span>
                        <span className="block text-xs text-muted">{kindLabel(p)}</span>
                      </Link>
                    </Td>
                    <Td className="num font-medium">{p.codes.join(" · ") || <span className="text-faint">—</span>}</Td>
                    <Td className="num tabular-nums">
                      {prices.length ? (
                        <span className="flex flex-col gap-0.5">{prices.map((x) => <span key={x.id}>{fmtTHB(x.amount_satang)} <span className="text-xs text-muted">{priceSuffix(x)}</span></span>)}</span>
                      ) : <Status tone="bad">ยังไม่มีราคา</Status>}
                    </Td>
                    <Td>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Status tone={p.active ? "good" : "neutral"}>{p.active ? "เปิดขาย" : "ปิดขาย"}</Status>
                        {p.featured && <Badge>แนะนำ</Badge>}
                        {p.audience === "returning" && <Badge>ลูกค้าเก่า</Badge>}
                        {p.available_until && (new Date(p.available_until) < new Date()
                          ? <Status tone="neutral">หมดเวลาโปร</Status>
                          : <span className="text-xs text-muted">ถึง {fmtDate(p.available_until)}</span>)}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableBox>
        ) : (
          <EmptyLine>ยังไม่มีสินค้า กด “เพิ่มสินค้า” เพื่อสร้างสินค้ารายตัวหรือแพ็กเกจรวม</EmptyLine>
        )}
      </Section>
    </>
  );
}
