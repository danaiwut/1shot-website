import { notFound } from "next/navigation";
import { BackLink } from "@/components/app/kit";
import { IndicatorDetail, loadIndicatorDetail } from "@/components/store/indicator-detail";
import { requireViewer } from "@/lib/auth";
import { loadIndicator } from "@/lib/indicators";

export async function generateMetadata({ params }: PageProps<"/store/[code]">) {
  const { supabase } = await requireViewer();
  const ind = await loadIndicator(supabase, (await params).code.toUpperCase());
  return { title: ind ? `ซื้อ ${ind.name}` : "ร้านค้า" };
}

/** Member version of /indicators/[code]: same body, inside the dashboard. */
export default async function StoreItemPage({ params }: PageProps<"/store/[code]">) {
  const code = (await params).code.toUpperCase();
  const { supabase, userId } = await requireViewer();
  const data = await loadIndicatorDetail(supabase, code, userId);
  if (!data) notFound();

  return (
    <>
      <BackLink href="/store">ร้านค้า</BackLink>
      <IndicatorDetail data={data} shell="app" base="/store" />
    </>
  );
}
