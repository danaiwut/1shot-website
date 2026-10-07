import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Empty, FilterLink } from "@/components/ui";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { describeAudit } from "@/lib/support";
import type { AuditEntry } from "@/lib/types";
import { Panel, Segmented, td, Th, theadRow, Toolbar } from "../_components/admin-ui";

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
      <Panel title={f.label} description={`${rows.length} รายการ`}>
        <Toolbar>
          <Segmented label="กรองประวัติตามประเภท">
            {FILTERS.map((x) => <FilterLink key={x.id} href={`/admin/access-history?type=${x.id}`} on={f.id === x.id}>{x.label}</FilterLink>)}
          </Segmented>
        </Toolbar>
        {rows.length ? (
          <Table className="min-w-[760px]">
            <caption className="sr-only">ประวัติการจัดการสิทธิ์ {rows.length} รายการ</caption>
            <TableHeader>
              <TableRow className={theadRow}>
                <Th>เวลา</Th>
                <Th>การกระทำ</Th>
                <Th>สมาชิก</Th>
                <Th>โดย</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => {
                const d = describeAudit(e);
                return (
                  <TableRow key={e.id} className="border-line align-top">
                    <TableCell className={`${td} text-muted`}><time dateTime={e.created_at}>{fmtDateTime(e.created_at)}</time></TableCell>
                    <TableCell className={`${td} whitespace-normal`}>
                      <span className="font-medium">{d.title}</span>
                      {d.detail && <span className="block max-w-md text-xs text-muted">{d.detail}</span>}
                    </TableCell>
                    <TableCell className={td}>
                      {e.subject_id ? <Link href={`/admin/members/${e.subject_id}`} className="inline-flex min-h-11 items-center font-medium underline-offset-4 hover:text-accent hover:underline">{who(e.subject)}</Link> : <span className="text-faint">—</span>}
                    </TableCell>
                    <TableCell className={td}>
                      {e.actor_id ? who(e.actor) : <Badge tone="info">ระบบ (การชำระเงิน / อัตโนมัติ)</Badge>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : <Empty title="ยังไม่มีประวัติในหมวดนี้" />}
      </Panel>
    </>
  );
}
