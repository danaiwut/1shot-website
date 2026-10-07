import { ExternalLink } from "lucide-react";
import { EmptyLine, Section } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { requireViewer } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";

export const metadata = { title: "ข่าวและสรุปตลาด" };

type News = { id: number; source: string; title: string; title_th: string | null; link: string; gold_impact: string | null; published_at: string };

/** The impact text itself starts with หนุน / กดดัน, so colour only reinforces the words. */
function impactTone(text: string | null) {
  if (text?.startsWith("หนุน")) return "text-buy";
  if (text?.startsWith("กดดัน")) return "text-sell";
  return "text-muted";
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
      <PageHeader title="ข่าวและสรุปตลาด" description="สรุปเช้าประจำวันและข่าวโลกที่มีผลต่อทองคำ" />
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:items-start">
        <Section title="สรุปเช้า" description={brief ? fmtDate(brief.brief_date) : "เผยแพร่ทุกเช้า"}>
          {brief ? (
            <div className="space-y-4 px-4 py-5 sm:px-5">
              <p className="text-sm leading-relaxed whitespace-pre-line">{brief.story}</p>
              <details className="group border-t border-line pt-1">
                <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-muted hover:text-fg">
                  ข้อเท็จจริงที่ใช้สรุป
                </summary>
                <p className="pb-1 text-sm leading-relaxed whitespace-pre-line text-muted">{brief.facts}</p>
              </details>
            </div>
          ) : (
            <EmptyLine>ยังไม่มีสรุปวันนี้ สรุปเช้าจะเผยแพร่ประมาณ 07:00 น.</EmptyLine>
          )}
        </Section>

        <Section title="ข่าวโลก" description={`ผลต่อทองคำเป็นการประเมินเบื้องต้น${items.length ? ` · ${items.length} ข่าว` : ""}`}>
          {items.length ? (
            <ul className="divide-y divide-line">
              {items.map((n) => (
                <li key={n.id}>
                  <a href={n.link} target="_blank" rel="noopener noreferrer" className="group block px-4 py-3.5 outline-none transition-colors hover:bg-panel-2 focus-visible:bg-panel-2 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 sm:px-5">
                    <span className="flex items-start gap-2 text-sm font-medium group-hover:underline">
                      <span className="min-w-0 flex-1">{n.title_th || n.title}<span className="sr-only"> (เปิดแท็บใหม่)</span></span>
                      <ExternalLink aria-hidden className="mt-0.5 size-3.5 shrink-0 text-faint" />
                    </span>
                    {n.gold_impact && <span className={`mt-1 block text-sm leading-relaxed ${impactTone(n.gold_impact)}`}>{n.gold_impact}</span>}
                    <span className="mt-1 block text-xs text-muted">{n.source} · <time dateTime={n.published_at} className="num">{fmtDateTime(n.published_at)}</time></span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyLine>ยังไม่มีข่าว ข่าวที่เกี่ยวกับทองคำจะแสดงที่นี่เมื่อมีอัปเดต</EmptyLine>
          )}
        </Section>
      </div>
    </>
  );
}
