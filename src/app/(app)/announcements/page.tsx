import { EmptyLine } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import type { Announcement } from "@/lib/types";

export const metadata = { title: "ประกาศ" };

export default async function AnnouncementsPage() {
  const { supabase } = await requireViewer();
  const { data } = await supabase.from("announcements").select("*").eq("published", true)
    .order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(50);
  const list = (data ?? []) as Announcement[];
  const pinned = list.filter((a) => a.pinned).length;

  return (
    <>
      <PageHeader
        title="ประกาศ"
        description={list.length ? `ข่าวสารจากทีมงาน 1SHOT · ${list.length} ประกาศ${pinned ? ` · ปักหมุด ${pinned}` : ""}` : "ข่าวสารและคำแนะนำจากทีมงาน 1SHOT"}
      />
      <div className="max-w-3xl overflow-hidden rounded-lg border border-line bg-panel">
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map((a) => (
              <li key={a.id}>
                <article aria-labelledby={`ann-${a.id}`} className="px-4 py-5 sm:px-5">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    {a.pinned && <Badge>ปักหมุด</Badge>}
                    <time dateTime={a.created_at} className="num">{fmtDate(a.created_at)}</time>
                  </p>
                  <h2 id={`ann-${a.id}`} className="mt-1.5 text-base font-semibold">{a.title}</h2>
                  {a.body && <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{a.body}</p>}
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyLine>ยังไม่มีประกาศ เมื่อทีมงานโพสต์ จะแสดงที่นี่</EmptyLine>
        )}
      </div>
    </>
  );
}
