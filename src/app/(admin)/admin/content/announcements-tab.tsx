import { Pencil, Pin } from "lucide-react";
import Link from "next/link";
import { EmptyLine, Section, Status, TextLink } from "@/components/app/kit";
import { cx } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import type { Announcement } from "@/lib/types";
import { AnnouncementForm } from "./announcements-forms";

export async function AnnouncementsTab({ edit }: { edit?: string }) {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(100);
  const list = (data ?? []) as Announcement[];
  const published = list.filter((a) => a.published).length;
  const pinned = list.filter((a) => a.pinned).length;
  const editing = edit ? list.find((a) => a.id === edit) : undefined;

  return (
    <div className="space-y-10">
      <section id="editor" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight">{editing ? `แก้ไข: ${editing.title}` : "เขียนประกาศใหม่"}</h2>
            <p className="mt-0.5 text-sm text-muted">ประกาศที่เผยแพร่จะแสดงให้สมาชิกเห็นทันที</p>
          </div>
          {editing && <TextLink href="/admin/content?tab=announcements">+ เขียนประกาศใหม่แทน</TextLink>}
        </div>
        <AnnouncementForm key={editing?.id ?? "new"} item={editing} />
      </section>

      <Section title="ประกาศทั้งหมด" description={`${list.length} รายการ · เผยแพร่ ${published} · ปักหมุด ${pinned}`}>
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map((a) => {
              const current = editing?.id === a.id;
              return (
                <li key={a.id}>
                  <Link
                    href={`/admin/content?tab=announcements&edit=${a.id}#editor`}
                    aria-current={current ? "true" : undefined}
                    className={cx("group flex min-h-16 items-start gap-4 px-4 py-4 transition-colors hover:bg-panel-2/60 sm:px-6", current && "bg-brand-dim/40")}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        {a.pinned && <Pin aria-label="ปักหมุด" className="size-4 shrink-0 text-accent" />}
                        <span className="truncate font-bold">{a.title}</span>
                      </span>
                      {a.body && <span className="mt-0.5 line-clamp-1 text-sm text-muted">{a.body}</span>}
                      <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <Status tone={a.published ? "good" : "neutral"}>{a.published ? "เผยแพร่" : "ซ่อน"}</Status>
                        {current && <Status tone="warn">กำลังแก้ไข</Status>}
                        <span className="num">{fmtDateTime(a.created_at)}</span>
                      </span>
                    </span>
                    <span className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-medium group-hover:border-fg">
                      <Pencil aria-hidden className="size-3.5" /> แก้ไข
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : <EmptyLine>ยังไม่มีประกาศ</EmptyLine>}
      </Section>
    </div>
  );
}
