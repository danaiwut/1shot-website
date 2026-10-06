import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, ButtonLink, Card, Empty } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtTHB, priceSuffix } from "@/lib/store/pricing";
import type { Product } from "@/lib/types";

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
        action={<ButtonLink href="/admin/products/new"><Plus className="size-4" /> เพิ่มสินค้า</ButtonLink>}
      />
      <Card className="overflow-hidden">
        {products.length ? (
          <ul className="divide-y divide-line">
            {products.map((p) => {
              const prices = (p.product_prices ?? []).filter((x) => x.active).sort((a, b) => a.amount_satang - b.amount_satang);
              return (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 hover:bg-panel-2 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        {p.name}
                        <Badge>{p.kind === "bundle" ? "แพ็กเกจรวม" : "รายตัว"}</Badge>
                        {p.featured && <Badge tone="brand">แนะนำ</Badge>}
                        {!p.active && <Badge tone="sell">ปิดขาย</Badge>}
                      </p>
                      <p className="num mt-0.5 text-xs text-muted">{p.codes.join(" · ")}</p>
                    </div>
                    <p className="num text-right text-xs text-muted">
                      {prices.length ? prices.map((x) => `${fmtTHB(x.amount_satang)} ${priceSuffix(x)}`).join("  ·  ") : <span className="text-sell">ยังไม่มีราคา</span>}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty title="ยังไม่มีสินค้า">กด “เพิ่มสินค้า” เพื่อสร้างสินค้ารายตัวหรือแพ็กเกจรวม</Empty>
        )}
      </Card>
    </>
  );
}
