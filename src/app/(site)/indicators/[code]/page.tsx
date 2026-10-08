import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { IndicatorDetail, loadIndicatorDetail } from "@/components/store/indicator-detail";
import { getViewer } from "@/lib/auth";
import { loadIndicator } from "@/lib/indicators";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/indicators/[code]">) {
  const ind = await loadIndicator(await createClient(), (await params).code.toUpperCase());
  return ind ? { title: `${ind.name} (${ind.code}) · อินดิเคเตอร์`, description: ind.description } : { title: "ไม่พบอินดิเคเตอร์" };
}

export default async function IndicatorPage({ params }: PageProps<"/indicators/[code]">) {
  const code = (await params).code.toUpperCase();
  const [supabase, viewer] = await Promise.all([createClient(), getViewer()]);
  const data = await loadIndicatorDetail(supabase, code, viewer?.userId);
  if (!data) notFound();

  return (
    <main className="min-h-dvh bg-panel-2 text-fg">
      <div className="-mt-18 border-b border-line bg-panel pt-18">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <nav aria-label="ตำแหน่งปัจจุบัน">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
              <li><Link href="/" className="hover:text-accent">หน้าแรก</Link></li><ChevronRight aria-hidden className="size-3" />
              <li><Link href="/pricing#singles" className="hover:text-accent">อินดิเคเตอร์</Link></li><ChevronRight aria-hidden className="size-3" />
              <li aria-current="page" className="font-medium text-fg">{data.ind.name}</li>
            </ol>
          </nav>
        </div>
      </div>
      <IndicatorDetail data={data} shell="site" base="/indicators" />
    </main>
  );
}
