import { CreditCard, ShieldCheck, User } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Empty } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { describeAudit } from "@/lib/support";
import type { AuditEntry } from "@/lib/types";
import { Section } from "../_components/section";

export const metadata = { title: "ประวัติของฉัน" };

export default async function ActivityPage() {
  const { supabase, userId } = await requireViewer();
  const { data } = await supabase.from("audit_log").select("*").eq("subject_id", userId).order("created_at", { ascending: false }).limit(100);
  const list = (data ?? []) as AuditEntry[];
  const actor = (e: AuditEntry) =>
    e.actor_id === null
      ? { label: "โดยระบบ (การชำระเงิน)", tone: "info" as const, Icon: CreditCard }
      : e.actor_id === userId
        ? { label: "โดยคุณ", tone: "brand" as const, Icon: User }
        : { label: "โดยทีมงาน", tone: "neutral" as const, Icon: ShieldCheck };

  return (
    <>
      <PageHeader title="ประวัติของฉัน" description="บันทึกทุกครั้งที่สิทธิ์ สถานะ IB หรือบัญชีของคุณเปลี่ยน ทั้งจากการซื้อและจากทีมงาน" />
      <Section title="บันทึกการเปลี่ยนแปลง" description={list.length ? `${list.length} รายการล่าสุด เรียงจากใหม่ไปเก่า` : "ยังไม่มีบันทึก"}>
        {list.length ? (
          <ol className="divide-y divide-line">
            {list.map((e) => {
              const d = describeAudit(e);
              const a = actor(e);
              return (
                <li key={e.id} className="flex gap-4 px-6 py-4">
                  <span aria-hidden className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-panel-2 text-muted"><a.Icon className="size-4" /></span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">{d.title}</p>
                      {d.detail && <p className="mt-0.5 text-sm text-muted">{d.detail}</p>}
                      <Badge tone={a.tone} className="mt-2">{a.label}</Badge>
                    </div>
                    <time dateTime={e.created_at} className="num shrink-0 text-sm text-muted">{fmtDateTime(e.created_at)}</time>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <Empty title="ยังไม่มีประวัติ">เมื่อสิทธิ์หรือข้อมูลบัญชีของคุณเปลี่ยน จะบันทึกไว้ที่นี่</Empty>
        )}
      </Section>
    </>
  );
}
