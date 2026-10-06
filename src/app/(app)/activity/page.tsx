import { PageHeader } from "@/components/app/page-header";
import { Card, Empty } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { describeAudit } from "@/lib/support";
import type { AuditEntry } from "@/lib/types";

export const metadata = { title: "ประวัติของฉัน" };

export default async function ActivityPage() {
  const { supabase, userId } = await requireViewer();
  const { data } = await supabase.from("audit_log").select("*").eq("subject_id", userId).order("created_at", { ascending: false }).limit(100);
  const list = (data ?? []) as AuditEntry[];
  return (
    <>
      <PageHeader title="ประวัติของฉัน" description="บันทึกทุกครั้งที่สิทธิ์ สถานะ IB หรือบัญชีของคุณเปลี่ยน ทั้งจากการซื้อและจากทีมงาน" />
      <Card className="overflow-hidden">
        {list.length ? (
          <ol className="divide-y divide-line">
            {list.map((e) => {
              const d = describeAudit(e);
              return (
                <li key={e.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <p className="font-semibold">{d.title}</p>
                    {d.detail && <p className="text-sm text-muted">{d.detail}</p>}
                    <p className="text-sm text-muted">{e.actor_id === null ? "โดยระบบ (การชำระเงิน)" : e.actor_id === userId ? "โดยคุณ" : "โดยทีมงาน"}</p>
                  </div>
                  <time dateTime={e.created_at} className="text-sm text-muted">{fmtDateTime(e.created_at)}</time>
                </li>
              );
            })}
          </ol>
        ) : (
          <Empty title="ยังไม่มีประวัติ">เมื่อสิทธิ์หรือข้อมูลบัญชีของคุณเปลี่ยน จะบันทึกไว้ที่นี่</Empty>
        )}
      </Card>
    </>
  );
}
