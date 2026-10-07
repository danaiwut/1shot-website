import { EmptyLine, Section } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { requireViewer } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { describeAudit } from "@/lib/support";
import type { AuditEntry } from "@/lib/types";

export const metadata = { title: "ประวัติของฉัน" };

export default async function ActivityPage() {
  const { supabase, userId } = await requireViewer();
  const { data } = await supabase.from("audit_log").select("*").eq("subject_id", userId).order("created_at", { ascending: false }).limit(100);
  const list = (data ?? []) as AuditEntry[];
  const actor = (e: AuditEntry) => (e.actor_id === null ? "โดยระบบ (การชำระเงิน)" : e.actor_id === userId ? "โดยคุณ" : "โดยทีมงาน");

  return (
    <>
      <PageHeader title="ประวัติของฉัน" description="บันทึกทุกครั้งที่สิทธิ์ สถานะ IB หรือบัญชีของคุณเปลี่ยน ทั้งจากการซื้อและจากทีมงาน" />
      <Section title="บันทึกการเปลี่ยนแปลง" description={list.length ? `${list.length} รายการล่าสุด เรียงจากใหม่ไปเก่า` : undefined}>
        {list.length ? (
          <ol className="divide-y divide-line">
            {list.map((e) => {
              const d = describeAudit(e);
              return (
                <li key={e.id} className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:px-5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{d.title}</p>
                    {d.detail && <p className="mt-0.5 text-sm text-muted">{d.detail}</p>}
                  </div>
                  <p className="shrink-0 text-sm text-muted sm:text-right">
                    <time dateTime={e.created_at} className="num tabular-nums">{fmtDateTime(e.created_at)}</time>
                    <span className="block">{actor(e)}</span>
                  </p>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyLine>ยังไม่มีประวัติ เมื่อสิทธิ์หรือข้อมูลบัญชีของคุณเปลี่ยน จะบันทึกไว้ที่นี่</EmptyLine>
        )}
      </Section>
    </>
  );
}
