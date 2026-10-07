import { ChevronDown } from "lucide-react";
import { EmptyLine, Section, SettingsSection, Status } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import type { Announcement } from "@/lib/types";
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
      <PageHeader title="ประกาศ" description="ข่าวสารและคำแนะนำที่สมาชิกเห็นในเมนู ประกาศ" />
      <div className="space-y-10">
        <div>
          <SettingsSection title="เขียนประกาศใหม่" description="ประกาศที่เผยแพร่จะแสดงให้สมาชิกเห็นทันที">
            <AnnouncementForm />
          </SettingsSection>
        </div>
        <Section title="ประกาศทั้งหมด" description={`${list.length} รายการ · เผยแพร่ ${published} · ปักหมุด ${pinned}`}>
          {list.length ? (
            <ul className="divide-y divide-line">
              {list.map((a) => (
                <li key={a.id}>
                  <details className="group">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 transition-colors hover:bg-panel-2 sm:px-5 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{a.title}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                          <Status tone={a.published ? "good" : "neutral"}>{a.published ? "เผยแพร่" : "ซ่อน"}</Status>
                          {a.pinned && <Badge>ปักหมุด</Badge>}
                          <span className="num">{fmtDateTime(a.created_at)}</span>
                        </span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent">
                        <span className="group-open:hidden">แก้ไข</span><span className="hidden group-open:inline">ปิด</span>
                        <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
                      </span>
                    </summary>
                    <div className="border-t border-line bg-panel-2 p-4 sm:p-5"><AnnouncementForm item={a} /></div>
                  </details>
                </li>
              ))}
            </ul>
          ) : <EmptyLine>ยังไม่มีประกาศ</EmptyLine>}
        </Section>
      </div>
    </>
  );
}
