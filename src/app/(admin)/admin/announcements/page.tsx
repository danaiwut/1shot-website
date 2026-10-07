import { ChevronDown, Megaphone, Pin } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Empty } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import type { Announcement } from "@/lib/types";
import { Panel } from "../_components/admin-ui";
import { AnnouncementForm } from "./forms";

export const metadata = { title: "ประกาศ" };

export default async function AdminAnnouncementsPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(100);
  const list = (data ?? []) as Announcement[];
  const published = list.filter((a) => a.published).length;
  const pinned = list.filter((a) => a.pinned).length;

  return (
    <>
      <PageHeader eyebrow="ระบบหลังบ้าน" title="ประกาศ" description="ข่าวสารและคำแนะนำที่สมาชิกเห็นในเมนู ประกาศ" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel className="self-start" title="เขียนประกาศใหม่" description="ประกาศที่เผยแพร่จะแสดงให้สมาชิกเห็นทันที">
          <div className="p-4 sm:p-6"><AnnouncementForm /></div>
        </Panel>
        <Panel title="ประกาศทั้งหมด" description={`${list.length} รายการ · เผยแพร่ ${published} · ปักหมุด ${pinned}`}>
          {list.length ? (
            <ul className="divide-y divide-line">
              {list.map((a) => (
                <li key={a.id}>
                  <details className="group">
                    <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-panel-2 sm:px-6 [&::-webkit-details-marker]:hidden">
                      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-dim text-accent">
                        {a.pinned ? <Pin className="size-4" /> : <Megaphone className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{a.title}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                          {a.pinned && <Badge tone="brand">ปักหมุด</Badge>}
                          <Badge tone={a.published ? "buy" : "neutral"}>{a.published ? "เผยแพร่" : "ซ่อน"}</Badge>
                          <span>{fmtDateTime(a.created_at)}</span>
                        </span>
                      </span>
                      <ChevronDown aria-hidden className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-line bg-panel-2/40 p-4 sm:p-6"><AnnouncementForm item={a} /></div>
                  </details>
                </li>
              ))}
            </ul>
          ) : <Empty title="ยังไม่มีประกาศ" />}
        </Panel>
      </div>
    </>
  );
}
