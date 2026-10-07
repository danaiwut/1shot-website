import { ChevronDown, ExternalLink, Sunrise } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Empty } from "@/components/ui";
import { CardContent } from "@/components/ui/card";
import { requireViewer } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { Section } from "../_components/section";

export const metadata = { title: "ข่าวและสรุปตลาด" };

type News = { id: number; source: string; title: string; title_th: string | null; link: string; gold_impact: string | null; published_at: string };

/** The impact text itself starts with หนุน / กดดัน, so colour only reinforces the words. */
function impactTone(text: string | null) {
  if (text?.startsWith("หนุน")) return "border-buy/30 bg-buy-dim text-buy";
  if (text?.startsWith("กดดัน")) return "border-sell/30 bg-sell-dim text-sell";
  return "border-line bg-panel-2 text-muted";
}

export default async function NewsPage() {
  const { supabase } = await requireViewer();
  const [{ data: brief }, { data: news }] = await Promise.all([
    supabase.from("daily_briefs").select("*").order("brief_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("news_items").select("*").order("published_at", { ascending: false }).limit(40),
  ]);

  const items = (news ?? []) as News[];

  return (
    <>
      <PageHeader eyebrow="ข่าวสาร" title="ข่าวและสรุปตลาด" description="สรุปเช้าประจำวันและข่าวโลกที่มีผลต่อทองคำ" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Section
          title="สรุปเช้า"
          description={brief ? fmtDate(brief.brief_date) : "เผยแพร่ทุกเช้า"}
          action={brief ? <Badge tone="brand"><Sunrise aria-hidden /> ประจำวัน</Badge> : undefined}
          className="self-start"
        >
          {brief ? (
            <CardContent className="space-y-5 px-6 py-6">
              <p className="text-base leading-relaxed whitespace-pre-line">{brief.story}</p>
              <details className="group rounded-xl border border-line bg-panel-2">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 text-sm font-medium text-muted hover:text-fg group-open:border-b group-open:border-line [&::-webkit-details-marker]:hidden">
                  ข้อเท็จจริงที่ใช้สรุป
                  <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-muted">{brief.facts}</p>
              </details>
            </CardContent>
          ) : (
            <Empty title="ยังไม่มีสรุปวันนี้">สรุปเช้าจะเผยแพร่ประมาณ 07:00 น.</Empty>
          )}
        </Section>

        <Section title="ข่าวโลก" description="ผลต่อทองคำเป็นการประเมินเบื้องต้น" action={items.length ? <Badge>{items.length} ข่าว</Badge> : undefined}>
          {items.length ? (
            <ul className="divide-y divide-line">
              {items.map((n) => {
                return (
                  <li key={n.id}>
                    <a href={n.link} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 px-6 py-4 outline-none transition-colors hover:bg-panel-2 focus-visible:bg-panel-2 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium group-hover:text-accent group-hover:underline">{n.title_th || n.title}<span className="sr-only"> (เปิดแท็บใหม่)</span></span>
                        {n.gold_impact && (
                          <span className={`mt-2 block rounded-lg border px-3 py-2 text-sm leading-relaxed ${impactTone(n.gold_impact)}`}>{n.gold_impact}</span>
                        )}
                        <span className="mt-1.5 block text-xs text-muted">{n.source} · <time dateTime={n.published_at}>{fmtDateTime(n.published_at)}</time></span>
                      </span>
                      <ExternalLink aria-hidden className="mt-0.5 size-4 shrink-0 text-faint group-hover:text-accent" />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty title="ยังไม่มีข่าว">ข่าวที่เกี่ยวกับทองคำจะแสดงที่นี่เมื่อมีอัปเดต</Empty>
          )}
        </Section>
      </div>
    </>
  );
}
