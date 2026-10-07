import Link from "next/link";
import { EmptyLine, Section, Status } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { SupportRequest } from "@/lib/types";
import { NewRequestForm } from "./forms";

export const metadata = { title: "คำขอและความช่วยเหลือ" };

const DOT = { brand: "warn", buy: "good", neutral: "neutral" } as const;

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
  const counts = [answered && `ทีมงานตอบแล้ว ${answered}`, waiting && `รอตอบ ${waiting}`].filter(Boolean).join(" · ");

  return (
    <>
      <PageHeader
        title="คำขอและความช่วยเหลือ"
        description="ขอสิทธิ์ ต่ออายุ แจ้งปัญหาห้องสมาชิก หรือสอบถามทีมงาน แล้วติดตามคำตอบได้ที่นี่"
        action={<ButtonLink href="/guide" variant="outline">คู่มือการใช้งาน</ButtonLink>}
      />

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:items-start">
        <Section title="ส่งคำขอใหม่" description="ทีมงานจะตอบกลับในหน้านี้ และสถานะจะเปลี่ยนเป็น “ทีมงานตอบแล้ว”">
          <div className="px-4 py-5 sm:px-5">
            <NewRequestForm
              indicators={(indicators ?? []) as { code: string; name: string }[]}
              defaultKind={typeof sp.kind === "string" ? sp.kind : undefined}
              defaultCode={typeof sp.code === "string" ? sp.code : undefined}
            />
          </div>
        </Section>

        <Section title="คำขอของฉัน" description={list.length ? `${list.length} เรื่อง${counts ? ` · ${counts}` : ""}` : undefined}>
          {list.length ? (
            <ul className="divide-y divide-line">
              {list.map((r) => {
                const st = SUPPORT_STATUS[r.status];
                return (
                  <li key={r.id}>
                    <Link href={`/support/${r.id}`} className="block min-h-14 px-4 py-3 outline-none transition-colors hover:bg-panel-2 focus-visible:bg-panel-2 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 sm:px-5">
                      <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="text-sm font-medium">{requestSubject(r.kind, r.indicator_code)}</span>
                        <Status tone={DOT[st.tone]}>{st.label}</Status>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-muted">{r.message}</span>
                      <span className="mt-0.5 block text-xs text-muted">ส่งเมื่อ <span className="num">{fmtDateTime(r.created_at)}</span></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyLine>ยังไม่มีคำขอ ส่งคำขอแรกได้จากฟอร์ม “ส่งคำขอใหม่”</EmptyLine>
          )}
        </Section>
      </div>
    </>
  );
}
