import { CheckCircle2, Receipt } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { CatalogView } from "@/components/store/catalog-view";
import { ButtonLink, Notice } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { loadCatalog, loadOwnership } from "@/lib/store/catalog";
import { Section } from "../_components/section";

export const metadata = { title: "ร้านค้า" };

export default async function StorePage({ searchParams }: PageProps<"/store">) {
  const { canceled } = await searchParams;
  const { supabase, userId } = await requireViewer();
  const [products, owned] = await Promise.all([loadCatalog(supabase), loadOwnership(supabase, userId)]);
  const codes = Object.entries(owned.access);

  return (
    <>
      <PageHeader
        eyebrow="ซื้อ · ต่ออายุ"
        title="ร้านค้า"
        description="ซื้อหรือต่ออายุสิทธิ์อินดิเคเตอร์ ซื้อซ้ำจะบวกเวลาต่อจากสิทธิ์เดิม"
        action={<ButtonLink href="/billing" variant="outline"><Receipt aria-hidden className="size-4" /> การชำระเงิน</ButtonLink>}
      />
      {canceled && <div className="mb-6"><Notice>ยกเลิกการชำระเงินแล้ว ยังไม่มีการตัดเงิน</Notice></div>}

      {codes.length > 0 && (
        <Section title="สิทธิ์ที่คุณมีตอนนี้" description="ซื้อซ้ำจะต่อเวลาจากวันหมดอายุเดิม" className="mb-6">
          <ul className="flex flex-wrap gap-2 px-6 py-5">
            {codes.map(([code, exp]) => (
              <li key={code} className="inline-flex items-center gap-2 rounded-xl border border-buy/30 bg-buy-dim px-3 py-2 text-sm text-buy">
                <CheckCircle2 aria-hidden className="size-4" />
                <span className="num font-semibold">{code}</span>
                <span className="text-xs">{exp ? `ถึง ${fmtDate(exp)}` : "ตลอดชีพ"}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <CatalogView products={products} access={owned.access} subscribed={owned.subscribed} from="/store" />
    </>
  );
}
