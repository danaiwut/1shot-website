import { EmptyLine, Row, Rows, Section, SettingsSection, Status, TextLink } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { cx } from "@/components/ui";
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
      <PageHeader title="ข่าวและสรุปเช้า" description="สรุปเช้าและข่าวที่สมาชิกเห็นในหน้า “ข่าวและสรุปตลาด” และแดชบอร์ด" />
      <div className="space-y-10">
        <div>
          <SettingsSection
            id="brief"
            title={editing ? `แก้ไขสรุปวันที่ ${fmtDate(editing.brief_date)}` : "เขียนสรุปเช้า"}
            description={editing
              ? <>บันทึกแล้วจะแทนที่สรุปเดิมของวันนี้ · <TextLink href="/admin/content">เขียนสรุปใหม่</TextLink></>
              : "สรุปภาวะตลาดทองคำสำหรับสมาชิก"}
          >
            <BriefForm today={today} brief={editing} />
          </SettingsSection>
        </div>

        <Section title="สรุปที่ผ่านมา" description={`30 วันล่าสุด · ${list.length} รายการ`}>
          {list.length ? (
            <Rows>
              {list.map((b) => {
                const current = editing?.brief_date === b.brief_date;
                return (
                  <Row key={b.brief_date} aria-current={current ? "true" : undefined} className={cx("flex-wrap items-start sm:flex-nowrap", current && "bg-panel-2")}>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium">{fmtDate(b.brief_date)}{current && <Status tone="warn">กำลังแก้ไข</Status>}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted">{b.story}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <TextLink href={`/admin/content?edit=${b.brief_date}`} aria-label={`แก้ไขสรุปวันที่ ${b.brief_date}`} className="px-2">แก้ไข</TextLink>
                      <DeleteBrief date={b.brief_date} />
                    </div>
                  </Row>
                );
              })}
            </Rows>
          ) : <EmptyLine>ยังไม่มีสรุปเช้า</EmptyLine>}
        </Section>

        <Section title="ข่าวโลก" description={`50 รายการล่าสุด · ${news?.length ?? 0} รายการ`}>
          {news?.length ? (
            <Rows>
              {(news as News[]).map((n) => (
                <Row key={n.id} className="items-start">
                  <div className="min-w-0 flex-1">
                    <a href={n.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium underline-offset-4 hover:text-accent hover:underline">
                      {n.title_th || n.title}<span className="sr-only"> (เปิดแท็บใหม่)</span>
                    </a>
                    <p className="mt-0.5 text-sm text-muted">{n.source} · {fmtDateTime(n.published_at)}</p>
                  </div>
                  <DeleteNews id={n.id} title={n.title_th || n.title} />
                </Row>
              ))}
            </Rows>
          ) : <EmptyLine>ยังไม่มีข่าว</EmptyLine>}
        </Section>

        <div>
          <SettingsSection title="เพิ่มข่าว" description="ข่าวที่เพิ่มจะแสดงในหน้า “ข่าวและสรุปตลาด” ตามเวลาเผยแพร่">
            <NewsForm now={now} />
          </SettingsSection>
        </div>
      </div>
    </>
  );
}
