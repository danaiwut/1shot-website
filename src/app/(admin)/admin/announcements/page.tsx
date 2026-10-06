import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, CardHeader, Empty } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import type { Announcement } from "@/lib/types";
import { AnnouncementForm } from "./forms";

export const metadata = { title: "ประกาศ" };

export default async function AdminAnnouncementsPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(100);
  const list = (data ?? []) as Announcement[];
  return (
    <>
      <PageHeader eyebrow="ระบบหลังบ้าน" title="ประกาศ" description="ข่าวสารและคำแนะนำที่สมาชิกเห็นในเมนู ประกาศ" />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card className="self-start p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">เขียนประกาศใหม่</h2>
          <AnnouncementForm />
        </Card>
        <Card className="overflow-hidden">
          <CardHeader title="ประกาศทั้งหมด" hint={`${list.length} รายการ`} />
          {list.length ? (
            <ul className="divide-y divide-line">
              {list.map((a) => (
                <li key={a.id} className="p-5">
                  <details>
                    <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-2">
                      <span className="font-semibold">{a.title}</span>
                      {a.pinned && <Badge tone="brand">ปักหมุด</Badge>}
                      <Badge tone={a.published ? "buy" : "neutral"}>{a.published ? "เผยแพร่" : "ซ่อน"}</Badge>
                      <span className="text-sm text-muted">{fmtDateTime(a.created_at)}</span>
                    </summary>
                    <div className="mt-4"><AnnouncementForm item={a} /></div>
                  </details>
                </li>
              ))}
            </ul>
          ) : <Empty title="ยังไม่มีประกาศ" />}
        </Card>
      </div>
    </>
  );
}
