import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Empty, FilterLink } from "@/components/ui";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { SupportRequest, SupportStatus } from "@/lib/types";
import { Panel, Segmented, td, Th, theadRow, Toolbar } from "../_components/admin-ui";

export const metadata = { title: "คำขอจากสมาชิก" };

type Row = SupportRequest & { profiles: { email: string; display_name: string | null } | null };
const FILTERS: { id: SupportStatus | "all"; label: string }[] = [
  { id: "open", label: "รอตอบ" }, { id: "answered", label: "ตอบแล้ว" }, { id: "resolved", label: "เสร็จสิ้น" }, { id: "all", label: "ทั้งหมด" },
];

export default async function AdminSupportPage({ searchParams }: PageProps<"/admin/support">) {
  const sp = await searchParams;
  const status = FILTERS.find((f) => f.id === sp.status)?.id ?? "open";
  const { supabase } = await requireStaff();
  let q = supabase.from("support_requests").select("*, profiles!support_requests_user_id_fkey(email, display_name)").order("updated_at", { ascending: false }).limit(200);
  if (status !== "all") q = q.eq("status", status);
  const [{ data }, { data: counts }] = await Promise.all([q, supabase.from("support_requests").select("status")]);
  const rows = (data ?? []) as Row[];
  const count = (s: string) => ((counts ?? []) as { status: string }[]).filter((r) => s === "all" || r.status === s).length;

  const current = FILTERS.find((f) => f.id === status)!;

  return (
    <>
      <PageHeader eyebrow="ระบบหลังบ้าน" title="คำขอจากสมาชิก" description="ตรวจสอบรายละเอียดและตอบกลับสมาชิก เรื่องที่รอตอบนานที่สุดอยู่ด้านล่าง" />
      <Panel title={current.label} description={`${rows.length} รายการ`}>
        <Toolbar>
          <Segmented label="กรองคำขอตามสถานะ">
            {FILTERS.map((f) => (
              <FilterLink key={f.id} href={`/admin/support?status=${f.id}`} on={status === f.id}>{f.label} <span className="num">({count(f.id)})</span></FilterLink>
            ))}
          </Segmented>
        </Toolbar>
        {rows.length ? (
          <Table className="min-w-[760px]">
            <caption className="sr-only">คำขอจากสมาชิก {rows.length} รายการ</caption>
            <TableHeader>
              <TableRow className={theadRow}>
                <Th>สมาชิก · เรื่อง</Th>
                <Th>ข้อความ</Th>
                <Th>ผู้รับเรื่อง</Th>
                <Th>อัปเดต</Th>
                <Th>สถานะ</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const st = SUPPORT_STATUS[r.status];
                return (
                  <TableRow key={r.id} className="border-line">
                    <TableCell className={td}>
                      <Link href={`/admin/support/${r.id}`} className="group inline-flex min-h-11 flex-col justify-center">
                        <span className="font-medium group-hover:text-accent group-hover:underline">{r.profiles?.display_name || r.profiles?.email || "—"}</span>
                        <span className="text-xs text-muted">{requestSubject(r.kind, r.indicator_code)}</span>
                      </Link>
                    </TableCell>
                    <TableCell className={`${td} max-w-xs`}><span className="block truncate text-muted">{r.message}</span></TableCell>
                    <TableCell className={td}>
                      <Badge tone={r.assigned_to ? "info" : "neutral"}>{r.assigned_to ? "มีผู้รับเรื่องแล้ว" : "ยังไม่มีผู้รับเรื่อง"}</Badge>
                    </TableCell>
                    <TableCell className={`${td} text-muted`}>{fmtDateTime(r.updated_at)}</TableCell>
                    <TableCell className={td}><Badge tone={st.tone}>{st.label}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Empty title="ไม่มีคำขอในสถานะนี้" />
        )}
      </Panel>
    </>
  );
}
