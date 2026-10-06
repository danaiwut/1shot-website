import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader, cx, Empty } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
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
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title={editing ? `แก้ไขสรุปวันที่ ${fmtDate(editing.brief_date)}` : "เขียนสรุปเช้า"}
              action={editing ? <Link href="/admin/content" className="text-xs text-accent underline underline-offset-4">เขียนสรุปใหม่</Link> : undefined} />
            <BriefForm today={today} brief={editing} />
          </Card>
          <Card>
            <CardHeader title="สรุปที่ผ่านมา" hint="30 วันล่าสุด" />
            {list.length ? (
              <ul className="divide-y divide-line">
                {list.map((b) => (
                  <li key={b.brief_date} className={cx("flex items-start justify-between gap-3 px-4 py-3 sm:px-5", editing?.brief_date === b.brief_date && "bg-panel-2")}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{fmtDate(b.brief_date)}</p>
                      <p className="line-clamp-2 text-xs text-muted">{b.story}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link href={`/admin/content?edit=${b.brief_date}`} aria-label={`แก้ไขสรุปวันที่ ${b.brief_date}`}
                        className="inline-flex h-11 items-center rounded-xl border border-line-strong px-3 text-sm font-medium hover:border-fg">แก้ไข</Link>
                      <DeleteBrief date={b.brief_date} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : <Empty title="ยังไม่มีสรุปเช้า" />}
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader title="ข่าวโลก" hint="50 รายการล่าสุด" />
          {news?.length ? (
            <ul className="divide-y divide-line">
              {(news as News[]).map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
                      {n.title_th || n.title}<span className="sr-only"> (เปิดแท็บใหม่)</span>
                    </a>
                    <p className="text-xs text-muted">{n.source} · {fmtDateTime(n.published_at)}</p>
                  </div>
                  <DeleteNews id={n.id} title={n.title_th || n.title} />
                </li>
              ))}
            </ul>
          ) : <Empty title="ยังไม่มีข่าว" />}
          <NewsForm now={now} />
        </Card>
      </div>
    </>
  );
}
