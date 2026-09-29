import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader, Empty } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";

export const metadata = { title: "ข่าวและสรุปตลาด" };

type News = { id: number; source: string; title: string; title_th: string | null; link: string; gold_impact: string | null; published_at: string };

function impactTone(text: string | null) {
  if (!text) return "text-muted";
  if (text.startsWith("หนุน")) return "text-buy";
  if (text.startsWith("กดดัน")) return "text-sell";
  return "text-muted";
}

export default async function NewsPage() {
  const { supabase } = await requireViewer();
  const [{ data: brief }, { data: news }] = await Promise.all([
    supabase.from("daily_briefs").select("*").order("brief_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("news_items").select("*").order("published_at", { ascending: false }).limit(40),
  ]);

  return (
    <>
      <PageHeader eyebrow="Market" title="ข่าวและสรุปตลาด" description="สรุปเช้าประจำวันและข่าวโลกที่มีผลต่อทองคำ" />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader title="สรุปเช้า" hint={brief ? fmtDate(brief.brief_date) : undefined} />
          {brief ? (
            <div className="space-y-5 px-5 py-5">
              <p className="text-[15px] leading-relaxed whitespace-pre-line">{brief.story}</p>
              <details className="group rounded-lg border border-line bg-panel-2">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm text-muted group-open:border-b group-open:border-line">ข้อเท็จจริงที่ใช้สรุป</summary>
                <p className="px-4 py-3 text-xs leading-relaxed whitespace-pre-line text-muted">{brief.facts}</p>
              </details>
            </div>
          ) : (
            <Empty title="ยังไม่มีสรุปวันนี้">สรุปเช้าจะเผยแพร่ประมาณ 07:00 น.</Empty>
          )}
        </Card>

        <Card>
          <CardHeader title="ข่าวโลก" hint="ผลต่อทองคำเป็นการประเมินเบื้องต้น" />
          {news?.length ? (
            <ul className="divide-y divide-line">
              {(news as News[]).map((n) => (
                <li key={n.id} className="px-5 py-4">
                  <a href={n.link} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-3">
                    <span className="text-sm font-medium group-hover:text-accent">{n.title_th || n.title}</span>
                    <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-faint" />
                  </a>
                  {n.gold_impact && <p className={`mt-1.5 text-xs leading-relaxed ${impactTone(n.gold_impact)}`}>{n.gold_impact}</p>}
                  <p className="mt-1.5 text-[11px] text-faint">{n.source} · {fmtDateTime(n.published_at)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="ยังไม่มีข่าว" />
          )}
        </Card>
      </div>
    </>
  );
}
