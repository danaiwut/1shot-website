import { Megaphone, Pin } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, cx, Empty } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        description="ข่าวสารและคำแนะนำจากทีมงาน 1SHOT"
        action={list.length ? <Badge>{list.length} ประกาศ{pinned ? ` · ปักหมุด ${pinned}` : ""}</Badge> : undefined}
      />
      {list.length ? (
        <ul className="mx-auto max-w-4xl space-y-4">
          {list.map((a) => (
            <li key={a.id}>
              <Card className={cx("gap-0 rounded-2xl py-0 shadow-xs", a.pinned && "border-brand/40")}>
                <article aria-labelledby={`ann-${a.id}`}>
                  <CardHeader className={cx("gap-2 py-5", a.body && "border-b border-line", a.pinned && "bg-brand-dim/30")}>
                    <CardDescription className="flex flex-wrap items-center gap-2 text-sm text-muted">
                      {a.pinned ? <Badge tone="brand"><Pin aria-hidden /> ปักหมุด</Badge> : <Megaphone aria-hidden className="size-4 text-accent" />}
                      <time dateTime={a.created_at}>{fmtDate(a.created_at)}</time>
                    </CardDescription>
                    <CardTitle><h2 id={`ann-${a.id}`} className="text-xl leading-snug font-bold">{a.title}</h2></CardTitle>
                  </CardHeader>
                  {a.body && <CardContent className="py-5"><p className="max-w-3xl leading-relaxed whitespace-pre-line">{a.body}</p></CardContent>}
                </article>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="rounded-2xl py-0 shadow-xs"><Empty title="ยังไม่มีประกาศ">เมื่อทีมงานโพสต์ประกาศ จะแสดงที่นี่</Empty></Card>
      )}
    </>
  );
}
