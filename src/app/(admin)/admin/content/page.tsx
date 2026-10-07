import { PenLine } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, ButtonLink, cx, Empty } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { Panel } from "../_components/admin-ui";
import { BriefForm, DeleteBrief, DeleteNews, NewsForm } from "./forms";

export const metadata = { title: "ข่าวและสรุปเช้า" };

type Brief = { brief_date: string; story: string; facts: string };
type News = { id: number; source: string; title: string; title_th: string | null; link: string; published_at: string };

export default async function ContentPage({ searchParams }: PageProps<"/admin/content">) {
  const { edit } = await searchParams;
  const { supabase } = await requireStaff();
  const [{ data: briefs }, { data: news }] = await Promise.all([
    supabase.from("daily_briefs").select("brief_date, story, facts").order("brief_date", { ascending: false }).limit(30),
    supabase.from("news_items").select("id, source, title, title_th, link, published_at").order("published_at", { ascending: false }).limit(50),
  ]);
  const list = (briefs ?? []) as Brief[];
  const editing = typeof edit === "string" ? list.find((b) => b.brief_date === edit) : undefined;
  const bkk = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", ...opts }).format(new Date());
  const today = bkk({});
  const now = `${today}T${bkk({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}`;

  return (
    <>
      <PageHeader eyebrow="ผู้ดูแลระบบ" title="ข่าวและสรุปเช้า" description="สรุปเช้าและข่าวที่สมาชิกเห็นในหน้า “ข่าวและสรุปตลาด” และแดชบอร์ด" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Panel
            title={editing ? `แก้ไขสรุปวันที่ ${fmtDate(editing.brief_date)}` : "เขียนสรุปเช้า"}
            description={editing ? "บันทึกแล้วจะแทนที่สรุปเดิมของวันนี้" : "สรุปภาวะตลาดทองคำสำหรับสมาชิก"}
            action={editing ? <ButtonLink href="/admin/content" variant="outline"><PenLine aria-hidden className="size-4" /> เขียนสรุปใหม่</ButtonLink> : undefined}
          >
            <BriefForm today={today} brief={editing} />
          </Panel>
          <Panel title="สรุปที่ผ่านมา" description={`30 วันล่าสุด · ${list.length} รายการ`}>
            {list.length ? (
              <ul className="divide-y divide-line">
                {list.map((b) => {
                  const current = editing?.brief_date === b.brief_date;
                  return (
                    <li key={b.brief_date} aria-current={current ? "true" : undefined} className={cx("flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6", current && "bg-brand-dim/40")}>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">{fmtDate(b.brief_date)}{current && <Badge tone="brand">กำลังแก้ไข</Badge>}</p>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted">{b.story}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <ButtonLink href={`/admin/content?edit=${b.brief_date}`} variant="outline" aria-label={`แก้ไขสรุปวันที่ ${b.brief_date}`}>แก้ไข</ButtonLink>
                        <DeleteBrief date={b.brief_date} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : <Empty title="ยังไม่มีสรุปเช้า" />}
          </Panel>
        </div>

        <Panel className="self-start" title="ข่าวโลก" description={`50 รายการล่าสุด · ${news?.length ?? 0} รายการ`}>
          {news?.length ? (
              <ul className="divide-y divide-line">
                {(news as News[]).map((n) => (
                  <li key={n.id} className="flex items-start justify-between gap-3 px-4 py-3 sm:px-6">
                    <div className="min-w-0">
                      <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium underline-offset-4 hover:text-accent hover:underline">
                        {n.title_th || n.title}<span className="sr-only"> (เปิดแท็บใหม่)</span>
                      </a>
                      <p className="mt-0.5 text-xs text-muted">{n.source} · {fmtDateTime(n.published_at)}</p>
                    </div>
                    <DeleteNews id={n.id} title={n.title_th || n.title} />
                  </li>
                ))}
              </ul>
          ) : <Empty title="ยังไม่มีข่าว" />}
          <NewsForm now={now} />
        </Panel>
      </div>
    </>
  );
}
