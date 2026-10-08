import { Megaphone, Pin } from "lucide-react";
import { CARD } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/toolbar";
import { ButtonLink, cx } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import type { Announcement } from "@/lib/types";

export const metadata = { title: "ประกาศ" };

export default async function AnnouncementsPage() {
  const { supabase } = await requireViewer();
  const { data } = await supabase.from("announcements").select("*").eq("published", true)
    .order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(50);
  const list = (data ?? []) as Announcement[];
  const pinned = list.filter((a) => a.pinned);
  const rest = list.filter((a) => !a.pinned);

  return (
    <>
      <PageHeader
        eyebrow="News from 1SHOT"
        title="ประกาศ"
        description={list.length ? `ข่าวสารจากทีมงาน 1SHOT · ${list.length} ประกาศ${pinned.length ? ` · ปักหมุด ${pinned.length}` : ""}` : "ข่าวสารและคำแนะนำจากทีมงาน 1SHOT"}
      />

      {!list.length ? (
        <div className={CARD}>
          <EmptyState icon={<Megaphone />} title="ยังไม่มีประกาศ" action={<ButtonLink href="/signals" variant="outline" className="rounded-full">ไปดูสัญญาณ</ButtonLink>}>
            เมื่อทีมงานโพสต์ข่าวสารหรือคำแนะนำ จะแสดงที่นี่
          </EmptyState>
        </div>
      ) : (
        <div className="space-y-10">
          {pinned.length > 0 && (
            <ul aria-label="ประกาศปักหมุด" className="grid gap-5 lg:grid-cols-2">
              {pinned.map((a) => (
                <li key={a.id} className={cx(CARD, "relative border-brand/40")}>
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-brand" />
                  <Item a={a} />
                </li>
              ))}
            </ul>
          )}
          {rest.length > 0 && (
            <ul aria-label="ประกาศทั้งหมด" className={cx(CARD, "divide-y divide-line")}>
              {rest.map((a) => <li key={a.id}><Item a={a} /></li>)}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

function Item({ a }: { a: Announcement }) {
  return (
    <article aria-labelledby={`ann-${a.id}`} className="px-5 py-6 sm:px-8 sm:py-7">
      <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
        {a.pinned && <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white"><Pin aria-hidden className="size-3" />ปักหมุด</span>}
        <time dateTime={a.created_at} className="num">{fmtDate(a.created_at)}</time>
      </p>
      <h2 id={`ann-${a.id}`} className="mt-2 text-xl font-bold tracking-tight">{a.title}</h2>
      {a.body && <p className="mt-3 max-w-3xl text-base leading-8 whitespace-pre-line text-fg/90">{a.body}</p>}
    </article>
  );
}
