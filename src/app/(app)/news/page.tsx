import { ExternalLink, Minus, Newspaper, Sunrise, TrendingDown, TrendingUp } from "lucide-react";
import { CARD } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/toolbar";
import { Dot } from "@/components/brand";
import { cx } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";

export const metadata = { title: "ข่าวและสรุปตลาด" };

type News = { id: number; source: string; title: string; title_th: string | null; link: string; gold_impact: string | null; published_at: string };

/** The impact text itself starts with หนุน / กดดัน, so colour and icon only reinforce the words. */
function impact(text: string | null) {
  if (text?.startsWith("หนุน")) return { box: "bg-buy-dim text-buy", Icon: TrendingUp };
  if (text?.startsWith("กดดัน")) return { box: "bg-sell-dim text-sell", Icon: TrendingDown };
  return { box: "bg-panel-3 text-muted", Icon: Minus };
}

export default async function NewsPage() {
  const { supabase } = await requireViewer();
  const [{ data: brief }, { data: news }] = await Promise.all([
    supabase.from("daily_briefs").select("*").order("brief_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("news_items").select("*").order("published_at", { ascending: false }).limit(40),
  ]);

  const items = (news ?? []) as News[];
  const up = items.filter((n) => n.gold_impact?.startsWith("หนุน")).length;
  const down = items.filter((n) => n.gold_impact?.startsWith("กดดัน")).length;

  return (
    <>
      <PageHeader eyebrow="Gold market" title="ข่าวและสรุปตลาด" description="สรุปเช้าประจำวันและข่าวโลกที่มีผลต่อทองคำ" />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:items-start">
        <section aria-labelledby="brief-title" className="relative overflow-hidden rounded-3xl border border-line bg-ink dark:border-white/10 text-fg shadow-[0_30px_80px_-40px_rgb(178_0_22/0.35)] dark:shadow-[0_30px_80px_-40px_rgb(178_0_22/0.6)]">
          <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full bg-brand/15 dark:bg-brand/40 blur-[120px]" />
          <div className="relative px-6 py-8 sm:px-8 sm:py-10">
            <p className="flex items-center gap-2 text-sm font-bold tracking-[0.18em] text-accent uppercase">
              <Sunrise aria-hidden className="size-4" /> Morning brief
            </p>
            <h2 id="brief-title" className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">สรุปเช้า<Dot /></h2>
            <p className="mt-1 text-sm text-muted">{brief ? fmtDate(brief.brief_date) : "เผยแพร่ทุกเช้า"}</p>
            {brief ? (
              <>
                <p className="mt-6 max-w-3xl text-base leading-8 whitespace-pre-line">{brief.story}</p>
                <details className="group mt-6 rounded-2xl border border-line bg-panel/60">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
                    ข้อเท็จจริงที่ใช้สรุป
                    <span aria-hidden className="transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-4 pb-4 text-sm leading-relaxed whitespace-pre-line text-muted">{brief.facts}</p>
                </details>
              </>
            ) : (
              <p className="mt-6 rounded-2xl border border-line bg-panel/60 px-4 py-5 text-sm text-muted">ยังไม่มีสรุปวันนี้ สรุปเช้าจะเผยแพร่ประมาณ 07:00 น. แวะกลับมาอีกครั้งหลังเวลานี้</p>
            )}
          </div>
        </section>

        <section aria-labelledby="news-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div>
              <h2 id="news-title" className="text-lg font-bold tracking-tight">ข่าวโลก</h2>
              <p className="mt-0.5 text-sm text-muted">ผลต่อทองคำเป็นการประเมินเบื้องต้น</p>
            </div>
            {items.length > 0 && (
              <p className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="num rounded-full bg-panel-3 px-3 py-1 text-muted">{items.length} ข่าว</span>
                <span className="num rounded-full bg-buy-dim px-3 py-1 text-buy">หนุน {up}</span>
                <span className="num rounded-full bg-sell-dim px-3 py-1 text-sell">กดดัน {down}</span>
              </p>
            )}
          </div>
          <div className={CARD}>
            {items.length ? (
              <ul className="divide-y divide-line">
                {items.map((n) => {
                  const { box, Icon } = impact(n.gold_impact);
                  return (
                    <li key={n.id}>
                      <a href={n.link} target="_blank" rel="noopener noreferrer" className="group block px-5 py-5 outline-none transition-colors hover:bg-panel-2/70 focus-visible:bg-panel-2 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 sm:px-6">
                        <span className="flex items-center gap-2 text-xs text-muted">
                          <span className="font-semibold text-fg">{n.source}</span> · <time dateTime={n.published_at} className="num">{fmtDateTime(n.published_at)}</time>
                        </span>
                        <span className="mt-1.5 flex items-start gap-2 font-semibold group-hover:underline">
                          <span className="min-w-0 flex-1">{n.title_th || n.title}<span className="sr-only"> (เปิดแท็บใหม่)</span></span>
                          <ExternalLink aria-hidden className="mt-1 size-4 shrink-0 text-faint group-hover:text-accent" />
                        </span>
                        {n.gold_impact && (
                          <span className={cx("mt-3 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed", box)}>
                            <Icon aria-hidden className="mt-1 size-4 shrink-0" />{n.gold_impact}
                          </span>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={<Newspaper />} title="ยังไม่มีข่าว">ข่าวที่เกี่ยวกับทองคำจะแสดงที่นี่เมื่อมีอัปเดต</EmptyState>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
