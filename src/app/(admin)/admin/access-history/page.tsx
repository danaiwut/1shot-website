import Link from "next/link";
import { EmptyLine, Section, Segmented, TableBox, Td, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { FilterLink } from "@/components/ui";
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
      <PageHeader title="ประวัติการจัดการสิทธิ์" description="บันทึกทุกการเพิ่ม ต่ออายุ ถอนสิทธิ์ เปลี่ยนบทบาท และตรวจ IB — ทั้งจากทีมงานและจากการชำระเงิน 200 รายการล่าสุด" />
      <Section
        title={f.label}
        description={`${rows.length} รายการ`}
        action={
          <Segmented label="กรองประวัติตามประเภท">
            {FILTERS.map((x) => <FilterLink key={x.id} href={`/admin/access-history?type=${x.id}`} on={f.id === x.id}>{x.label}</FilterLink>)}
          </Segmented>
        }
      >
        {rows.length ? (
          <TableBox caption={`ประวัติการจัดการสิทธิ์ ${rows.length} รายการ`} minWidth={760}>
            <thead className="bg-panel-2">
              <tr>
                <Th>เวลา</Th>
                <Th>การกระทำ</Th>
                <Th>สมาชิก</Th>
                <Th>โดย</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const d = describeAudit(e);
                return (
                  <tr key={e.id} className="border-t border-line align-top">
                    <Td className="num whitespace-nowrap text-muted tabular-nums"><time dateTime={e.created_at}>{fmtDateTime(e.created_at)}</time></Td>
                    <Td>
                      <span className="font-medium">{d.title}</span>
                      {d.detail && <span className="block max-w-md text-xs text-muted">{d.detail}</span>}
                    </Td>
                    <Td>
                      {e.subject_id ? <Link href={`/admin/members/${e.subject_id}`} className="inline-flex min-h-11 items-center font-medium underline-offset-4 hover:text-accent hover:underline">{who(e.subject)}</Link> : <span className="text-faint">—</span>}
                    </Td>
                    <Td>
                      {e.actor_id ? who(e.actor) : <span className="text-muted">ระบบ (การชำระเงิน / อัตโนมัติ)</span>}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableBox>
        ) : <EmptyLine>ยังไม่มีประวัติในหมวดนี้</EmptyLine>}
      </Section>
    </>
  );
}
