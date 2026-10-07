import { Row, Rows, Section, Status } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { CatalogView } from "@/components/store/catalog-view";
import { ButtonLink, Notice } from "@/components/ui";
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
      <PageHeader
        title="ร้านค้า"
        description="ซื้อหรือต่ออายุสิทธิ์อินดิเคเตอร์ ซื้อซ้ำจะบวกเวลาต่อจากสิทธิ์เดิม"
        action={<ButtonLink href="/billing" variant="outline">การชำระเงิน</ButtonLink>}
      />

      <div className="space-y-10">
        {canceled && <Notice>ยกเลิกการชำระเงินแล้ว ยังไม่มีการตัดเงิน</Notice>}

        {codes.length > 0 && (
          <Section title="สิทธิ์ที่คุณมีตอนนี้" description="ซื้อซ้ำจะต่อเวลาจากวันหมดอายุเดิม">
            <Rows>
              {codes.map(([code, exp]) => (
                <Row key={code} className="min-h-12 py-2.5">
                  <span className="num w-12 shrink-0 text-sm font-semibold text-accent">{code}</span>
                  <span className="flex-1 text-sm text-muted">{exp ? `ใช้ได้ถึง ${fmtDate(exp)}` : "ตลอดชีพ"}</span>
                  <Status tone="good">ใช้งานได้</Status>
                </Row>
              ))}
            </Rows>
          </Section>
        )}

        <CatalogView products={products} access={owned.access} subscribed={owned.subscribed} returning={owned.returning} from="/store" />
      </div>
    </>
  );
}
