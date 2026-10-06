import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, CardHeader, Empty } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { SupportRequest } from "@/lib/types";
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

  return (
    <>
      <PageHeader title="คำขอและความช่วยเหลือ" description="ขอสิทธิ์ ต่ออายุ แจ้งปัญหาห้องสมาชิก หรือสอบถามทีมงาน แล้วติดตามคำตอบได้ที่นี่" />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold"><LifeBuoy aria-hidden className="size-5 text-accent" /> ส่งคำขอใหม่</h2>
          <p className="mb-5 text-sm text-muted">ทีมงานจะตอบกลับในหน้านี้ และคุณจะเห็นสถานะเปลี่ยนเป็น “ทีมงานตอบแล้ว”</p>
          <NewRequestForm
            indicators={(indicators ?? []) as { code: string; name: string }[]}
            defaultKind={typeof sp.kind === "string" ? sp.kind : undefined}
            defaultCode={typeof sp.code === "string" ? sp.code : undefined}
          />
        </Card>

        <Card className="overflow-hidden self-start">
          <CardHeader title="คำขอของฉัน" hint={list.length ? `${list.length} เรื่อง` : undefined} />
          {list.length ? (
            <ul className="divide-y divide-line">
              {list.map((r) => {
                const st = SUPPORT_STATUS[r.status];
                return (
                  <li key={r.id}>
                    <Link href={`/support/${r.id}`} className="flex min-h-16 items-center justify-between gap-3 px-5 py-4 hover:bg-panel-2">
                      <span className="min-w-0">
                        <span className="block font-semibold">{requestSubject(r.kind, r.indicator_code)}</span>
                        <span className="block truncate text-sm text-muted">{r.message}</span>
                        <span className="block text-xs text-faint">ส่งเมื่อ {fmtDateTime(r.created_at)}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge tone={st.tone}>{st.label}</Badge>
                        <ArrowRight aria-hidden className="size-4 text-faint" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty title="ยังไม่มีคำขอ">ส่งคำขอแรกจากฟอร์มด้านซ้าย</Empty>
          )}
        </Card>
      </div>
    </>
  );
}
