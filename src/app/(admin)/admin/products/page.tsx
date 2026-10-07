import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, ButtonLink, Empty } from "@/components/ui";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaff } from "@/lib/auth";
import { fmtTHB, priceSuffix } from "@/lib/store/pricing";
import type { Product } from "@/lib/types";
import { Panel, td, Th, theadRow } from "../_components/admin-ui";

export const metadata = { title: "สินค้าและราคา" };

export default async function ProductsPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("products").select("*, product_prices(*)").order("sort");
  const products = (data ?? []) as Product[];

  return (
    <>
      <PageHeader
        eyebrow="ผู้ดูแลระบบ"
        title="สินค้าและราคา"
        description="สินค้าที่เปิดขายและมีราคาอย่างน้อย 1 ราคาจะแสดงในหน้าราคาและร้านค้า"
        action={<ButtonLink href="/admin/products/new"><Plus aria-hidden className="size-4" /> เพิ่มสินค้า</ButtonLink>}
      />
      <Panel title="สินค้าทั้งหมด" description={`${products.length} รายการ · เปิดขาย ${products.filter((p) => p.active).length}`}>
        {products.length ? (
          <Table className="min-w-[720px]">
            <caption className="sr-only">สินค้าและราคา</caption>
            <TableHeader>
              <TableRow className={theadRow}>
                <Th>สินค้า</Th>
                <Th>อินดิเคเตอร์</Th>
                <Th>ราคาที่เปิดขาย</Th>
                <Th>สถานะ</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const prices = (p.product_prices ?? []).filter((x) => x.active).sort((a, b) => a.amount_satang - b.amount_satang);
                return (
                  <TableRow key={p.id} className="border-line">
                    <TableCell className={td}>
                      <Link href={`/admin/products/${p.id}`} className="group inline-flex min-h-11 items-center gap-3">
                        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-dim text-accent"><Package className="size-4" /></span>
                        <span>
                          <span className="block font-medium group-hover:text-accent group-hover:underline">{p.name}</span>
                          <span className="block text-xs text-muted">{p.kind === "bundle" ? "แพ็กเกจรวม" : "รายตัว"}</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className={td}>
                      <span className="flex flex-wrap gap-1">{p.codes.map((c) => <Badge key={c} className="num">{c}</Badge>)}</span>
                    </TableCell>
                    <TableCell className={`${td} num`}>
                      {prices.length ? (
                        <span className="flex flex-col gap-0.5">{prices.map((x) => <span key={x.id}>{fmtTHB(x.amount_satang)} <span className="text-xs text-muted">{priceSuffix(x)}</span></span>)}</span>
                      ) : <Badge tone="sell">ยังไม่มีราคา</Badge>}
                    </TableCell>
                    <TableCell className={td}>
                      <span className="flex flex-wrap gap-1.5">
                        <Badge tone={p.active ? "buy" : "sell"}>{p.active ? "เปิดขาย" : "ปิดขาย"}</Badge>
                        {p.featured && <Badge tone="brand">แนะนำ</Badge>}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Empty title="ยังไม่มีสินค้า">กด “เพิ่มสินค้า” เพื่อสร้างสินค้ารายตัวหรือแพ็กเกจรวม</Empty>
        )}
      </Panel>
    </>
  );
}
