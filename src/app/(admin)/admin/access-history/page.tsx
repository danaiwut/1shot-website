import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Card, Empty, FilterLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { describeAudit } from "@/lib/support";
import type { AuditEntry } from "@/lib/types";

export const metadata = { title: "ประวัติการจัดการสิทธิ์" };

type Row = AuditEntry & {
  subject: { email: string; display_name: string | null } | null;
  actor: { email: string; display_name: string | null } | null;
};
const FILTERS = [
  { id: "all", label: "ทั้งหมด", prefix: "" }, { id: "rights", label: "สิทธิ์ Indicator", prefix: "right." },
  { id: "role", label: "บทบาท / ทีมงาน", prefix: "role." }, { id: "ib", label: "Exness IB", prefix: "ib." }, { id: "support", label: "คำขอ", prefix: "support." },
];

export default async function AccessHistoryPage({ searchParams }: PageProps<"/admin/access-history">) {
  const sp = await searchParams;
  const f = FILTERS.find((x) => x.id === sp.type) ?? FILTERS[0];
  const { supabase } = await requireStaff();
  let q = supabase.from("audit_log")
    .select("*, subject:profiles!audit_log_subject_id_fkey(email, display_name), actor:profiles!audit_log_actor_id_fkey(email, display_name)")
    .order("created_at", { ascending: false }).limit(200);
  if (f.prefix) q = q.like("action", `${f.prefix}%`);
  const { data } = await q;
  const rows = (data ?? []) as Row[];
  const who = (p: Row["actor"]) => p?.display_name || p?.email || "—";

  return (
    <>
      <PageHeader eyebrow="ระบบหลังบ้าน" title="ประวัติการจัดการสิทธิ์" description="บันทึกทุกการเพิ่ม ต่ออายุ ถอนสิทธิ์ เปลี่ยนบทบาท และตรวจ IB — ทั้งจากทีมงานและจากการชำระเงิน 200 รายการล่าสุด" />
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((x) => <FilterLink key={x.id} href={`/admin/access-history?type=${x.id}`} on={f.id === x.id}>{x.label}</FilterLink>)}
      </div>
      <Card className="overflow-hidden">
        {rows.length ? (
          <ol className="divide-y divide-line">
            {rows.map((e) => {
              const d = describeAudit(e);
              return (
                <li key={e.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {d.title} · {e.subject_id ? <Link href={`/admin/members/${e.subject_id}`} className="underline underline-offset-4 hover:text-accent">{who(e.subject)}</Link> : "—"}
                    </p>
                    {d.detail && <p className="text-sm text-muted">{d.detail}</p>}
                    <p className="text-sm text-muted">โดย {e.actor_id ? who(e.actor) : "ระบบ (การชำระเงิน / อัตโนมัติ)"}</p>
                  </div>
                  <time dateTime={e.created_at} className="shrink-0 text-sm text-muted">{fmtDateTime(e.created_at)}</time>
                </li>
              );
            })}
          </ol>
        ) : <Empty title="ยังไม่มีประวัติในหมวดนี้" />}
      </Card>
    </>
  );
}
