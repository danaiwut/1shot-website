import { Segmented } from "@/components/app/kit";
import { FilterLink } from "@/components/ui";

/** "ราคาและโปร" is one place with two tabs: what we sell, and the banner on the homepage. */
export function SalesTabs({ on }: { on: "products" | "promotions" }) {
  return (
    <Segmented label="ราคาและโปร" className="mb-8">
      <FilterLink href="/admin/products" on={on === "products"}>สินค้า ราคา และโปรจับคู่</FilterLink>
      <FilterLink href="/admin/promotions" on={on === "promotions"}>ป้ายโปรหน้าแรก</FilterLink>
    </Segmented>
  );
}
