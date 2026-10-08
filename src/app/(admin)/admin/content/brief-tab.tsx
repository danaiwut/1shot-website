import type { ReactNode } from "react";
import { EmptyLine, Row, Rows, Section, Status, TextLink } from "@/components/app/kit";
import { cx } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { BriefForm, DeleteBrief, DeleteNews, NewsForm } from "./forms";

type Brief = { brief_date: string; story: string; facts: string };
type News = { id: number; source: string; title: string; title_th: string | null; link: string; gold_impact: string | null; published_at: string };

const bkk = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", ...opts }).format(new Date());
const impactTone = (t: string) => (t.startsWith("หนุน") ? "text-buy" : t.startsWith("กดดัน") ? "text-sell" : "text-muted");

/** Editor heading: what you're doing + an escape hatch when editing. */
function EditorHead({ title, line, action }: { title: string; line: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-sm text-muted">{line}</p>
      </div>
      {action}
    </div>
  );
}

export async function BriefTab({ edit }: { edit?: string }) {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("daily_briefs").select("brief_date, story, facts").order("brief_date", { ascending: false }).limit(30);
  const list = (data ?? []) as Brief[];
  const editing = edit ? list.find((b) => b.brief_date === edit) : undefined;
  const today = bkk({});

  return (
    <div className="space-y-10">
      <section id="brief" className="scroll-mt-24">
        <EditorHead
          title={editing ? `แก้ไขสรุปวันที่ ${fmtDate(editing.brief_date)}` : "เขียนสรุปเช้า"}
          line={editing ? "บันทึกแล้วจะแทนที่สรุปเดิมของวันนั้น" : "สรุปภาวะตลาดทองคำสำหรับสมาชิก เผยแพร่ทันทีที่บันทึก"}
          action={editing && <TextLink href="/admin/content?tab=brief">+ เขียนสรุปใหม่แทน</TextLink>}
        />
        <BriefForm key={editing?.brief_date ?? today} today={today} brief={editing} />
      </section>

      <Section title="สรุปที่ผ่านมา" description={`30 วันล่าสุด · ${list.length} รายการ`}>
        {list.length ? (
          <Rows>
            {list.map((b, i) => {
              const current = editing?.brief_date === b.brief_date;
              return (
                <Row key={b.brief_date} aria-current={current ? "true" : undefined} className={cx("flex-wrap items-start sm:flex-nowrap", current && "bg-brand-dim/40")}>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-bold">{fmtDate(b.brief_date)}</span>
                      {current ? <Status tone="warn">กำลังแก้ไข</Status> : i === 0 && <Status tone="good">สมาชิกเห็นอยู่</Status>}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{b.story}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <TextLink href={`/admin/content?tab=brief&edit=${b.brief_date}#brief`} aria-label={`แก้ไขสรุปวันที่ ${b.brief_date}`} className="rounded-full border border-line px-4 no-underline hover:border-fg">แก้ไข</TextLink>
                    <DeleteBrief date={b.brief_date} />
                  </div>
                </Row>
              );
            })}
          </Rows>
        ) : <EmptyLine>ยังไม่มีสรุปเช้า</EmptyLine>}
      </Section>
    </div>
  );
}

export async function NewsTab() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("news_items").select("id, source, title, title_th, link, gold_impact, published_at").order("published_at", { ascending: false }).limit(50);
  const news = (data ?? []) as News[];
  const now = `${bkk({})}T${bkk({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}`;

  return (
    <div className="space-y-10">
      <section>
        <EditorHead title="เพิ่มข่าว" line="ข่าวที่เพิ่มจะแสดงในหน้า “ข่าวและสรุปตลาด” ตามเวลาเผยแพร่" />
        <NewsForm now={now} />
      </section>

      <Section title="ข่าวโลก" description={`50 รายการล่าสุด · ${news.length} รายการ`}>
        {news.length ? (
          <Rows>
            {news.map((n) => (
              <Row key={n.id} className="items-start">
                <div className="min-w-0 flex-1">
                  <a href={n.link} target="_blank" rel="noopener noreferrer" className="font-bold underline-offset-4 hover:text-accent hover:underline">
                    {n.title_th || n.title}<span className="sr-only"> (เปิดแท็บใหม่)</span>
                  </a>
                  {n.gold_impact && <p className={cx("mt-0.5 line-clamp-1 text-sm", impactTone(n.gold_impact))}>{n.gold_impact}</p>}
                  <p className="mt-0.5 text-xs text-muted">{n.source} · <span className="num">{fmtDateTime(n.published_at)}</span></p>
                </div>
                <DeleteNews id={n.id} title={n.title_th || n.title} />
              </Row>
            ))}
          </Rows>
        ) : <EmptyLine>ยังไม่มีข่าว</EmptyLine>}
      </Section>
    </div>
  );
}
