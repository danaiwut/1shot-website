import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { CatalogView } from "@/components/store/catalog-view";
import { Notice } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { loadCatalog, loadOwnership } from "@/lib/store/catalog";

export const metadata = { title: "ร้านค้า" };

export default async function StorePage({ searchParams }: PageProps<"/store">) {
  const { canceled } = await searchParams;
  const { supabase, userId } = await requireViewer();
  const [products, owned] = await Promise.all([loadCatalog(supabase), loadOwnership(supabase, userId)]);
  const codes = Object.entries(owned.access);

  return (
    <>
      <PageHeader eyebrow="ซื้อ · ต่ออายุ" title="ร้านค้า" description="ซื้อหรือต่ออายุสิทธิ์อินดิเคเตอร์ ซื้อซ้ำจะบวกเวลาต่อจากสิทธิ์เดิม" />
      {canceled && <div className="mb-6"><Notice>ยกเลิกการชำระเงินแล้ว ยังไม่มีการตัดเงิน</Notice></div>}
      {codes.length > 0 && (
        <div className="mb-8 rounded-2xl border border-line bg-panel p-4">
          <p className="text-xs font-medium text-muted">สิทธิ์ที่คุณมีตอนนี้ · <Link href="/billing" className="text-accent hover:underline">ดูการชำระเงิน</Link></p>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {codes.map(([code, exp]) => (
              <li key={code} className="num rounded-full border border-buy/30 bg-buy-dim px-2.5 py-1 text-[11px] font-semibold text-buy">
                {code} · {exp ? `ถึง ${fmtDate(exp)}` : "ตลอดชีพ"}
              </li>
            ))}
          </ul>
        </div>
      )}
      <CatalogView products={products} access={owned.access} subscribed={owned.subscribed} from="/store" />
    </>
  );
}
