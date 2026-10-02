import { CatalogView } from "@/components/store/catalog-view";
import { getViewer } from "@/lib/auth";
import { hasBackend } from "@/lib/env";
import { loadCatalog, loadOwnership } from "@/lib/store/catalog";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "ราคาและแพ็กเกจ" };

export default async function PricingPage() {
  const supabase = hasBackend() ? await createClient() : null;
  const [products, viewer] = supabase ? await Promise.all([loadCatalog(supabase), getViewer()]) : [[], null];
  const owned = viewer && supabase ? await loadOwnership(supabase, viewer.userId) : undefined;

  return (
    <main>
      <section className="surface-dark relative -mt-18 overflow-hidden bg-ink pt-18">
        <div className="brand-glow pointer-events-none absolute inset-0 opacity-80" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-14 text-center sm:px-6 sm:pt-20">
          <p className="eyebrow">ราคา</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            เลือกแพ็กเกจที่ใช่<span className="text-accent">.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">
            ซื้อรายตัวหรือแพ็กเกจรวม จ่ายรายเดือนหรือครั้งเดียว ชำระสำเร็จแล้วได้สิทธิ์ใช้อินดิเคเตอร์และห้องสัญญาณทันที
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <CatalogView products={products} access={owned?.access} subscribed={owned?.subscribed} from="/pricing" />
      </section>
    </main>
  );
}
