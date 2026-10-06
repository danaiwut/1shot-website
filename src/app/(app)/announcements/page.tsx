import { Pin } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, Empty } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import type { Announcement } from "@/lib/types";

export const metadata = { title: "ประกาศ" };

export default async function AnnouncementsPage() {
  const { supabase } = await requireViewer();
  const { data } = await supabase.from("announcements").select("*").eq("published", true)
    .order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(50);
  const list = (data ?? []) as Announcement[];
  return (
    <>
      <PageHeader title="ประกาศ" description="ข่าวสารและคำแนะนำจากทีมงาน 1SHOT" />
      {list.length ? (
        <ul className="space-y-4">
          {list.map((a) => (
            <li key={a.id}>
              <Card className="p-5 sm:p-6">
                <article aria-labelledby={`ann-${a.id}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    {a.pinned && <Badge tone="brand"><Pin aria-hidden className="size-3" /> ปักหมุด</Badge>}
                    <time dateTime={a.created_at} className="text-sm text-muted">{fmtDate(a.created_at)}</time>
                  </div>
                  <h2 id={`ann-${a.id}`} className="mt-2 text-xl font-bold">{a.title}</h2>
                  {a.body && <p className="mt-3 max-w-3xl whitespace-pre-line">{a.body}</p>}
                </article>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card><Empty title="ยังไม่มีประกาศ">เมื่อทีมงานโพสต์ประกาศ จะแสดงที่นี่</Empty></Card>
      )}
    </>
  );
}
