import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Inbox, LifeBuoy, MessageSquareReply } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Badge, ButtonLink, Empty } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { SupportRequest } from "@/lib/types";
import { Section } from "../_components/section";
import { NewRequestForm } from "./forms";

export const metadata = { title: "คำขอและความช่วยเหลือ" };

export default async function SupportPage({ searchParams }: PageProps<"/support">) {
  const sp = await searchParams;
  const { supabase, userId } = await requireViewer();
  const [{ data: requests }, { data: indicators }] = await Promise.all([
    supabase.from("support_requests").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(50),
    supabase.from("indicators").select("code, name").eq("is_reference", false).order("sort"),
  ]);
  const list = (requests ?? []) as SupportRequest[];
  const waiting = list.filter((r) => r.status === "open").length;
  const answered = list.filter((r) => r.status === "answered").length;

  return (
    <>
      <PageHeader
        title="คำขอและความช่วยเหลือ"
        description="ขอสิทธิ์ ต่ออายุ แจ้งปัญหาห้องสมาชิก หรือสอบถามทีมงาน แล้วติดตามคำตอบได้ที่นี่"
        action={<ButtonLink href="/guide" variant="outline"><BookOpen aria-hidden className="size-4" /> คู่มือการใช้งาน</ButtonLink>}
      />

      {list.length > 0 && (
        <section aria-label="สรุปคำขอ" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatCard icon={Inbox} label="คำขอทั้งหมด" value={`${list.length}`} foot="50 เรื่องล่าสุด" />
          <StatCard icon={Clock} label="รอทีมงานตอบ" value={`${waiting}`} foot="ทีมงานจะตอบในหน้าคำขอ" />
          <StatCard
            icon={MessageSquareReply} label="ทีมงานตอบแล้ว" value={`${answered}`} tone={answered ? "alert" : "default"}
            badge={answered ? <Badge tone="buy">อ่านคำตอบ</Badge> : undefined} foot="เปิดอ่านและตอบกลับได้"
          />
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Section
          title={<span className="flex items-center gap-2"><LifeBuoy aria-hidden className="size-5 text-accent" /> ส่งคำขอใหม่</span>}
          description="ทีมงานจะตอบกลับในหน้านี้ และสถานะจะเปลี่ยนเป็น “ทีมงานตอบแล้ว”"
          className="self-start"
        >
          <div className="px-6 py-6">
            <NewRequestForm
              indicators={(indicators ?? []) as { code: string; name: string }[]}
              defaultKind={typeof sp.kind === "string" ? sp.kind : undefined}
              defaultCode={typeof sp.code === "string" ? sp.code : undefined}
            />
          </div>
        </Section>

        <Section title="คำขอของฉัน" description={list.length ? `${list.length} เรื่อง เรียงตามการอัปเดตล่าสุด` : "ยังไม่มีคำขอ"} className="self-start">
          {list.length ? (
            <ul className="divide-y divide-line">
              {list.map((r) => {
                const st = SUPPORT_STATUS[r.status];
                return (
                  <li key={r.id}>
                    <Link href={`/support/${r.id}`} className="group flex min-h-16 items-center gap-3 px-6 py-4 outline-none transition-colors hover:bg-panel-2 focus-visible:bg-panel-2 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50">
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{requestSubject(r.kind, r.indicator_code)}</span>
                          <Badge tone={st.tone}>{st.label}</Badge>
                        </span>
                        <span className="mt-1 block truncate text-sm text-muted">{r.message}</span>
                        <span className="mt-0.5 block text-xs text-muted">ส่งเมื่อ {fmtDateTime(r.created_at)}</span>
                      </span>
                      <ArrowRight aria-hidden className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty title="ยังไม่มีคำขอ">ส่งคำขอแรกจากฟอร์ม “ส่งคำขอใหม่”</Empty>
          )}
        </Section>
      </div>
    </>
  );
}
