import Link from "next/link";
import { EmptyLine, Section, Segmented, TableBox, Td, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { FilterLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { SupportRequest, SupportStatus } from "@/lib/types";
import { ToneStatus } from "../_components/tone-status";

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
      <PageHeader title="คำขอจากสมาชิก" description="ตรวจสอบรายละเอียดและตอบกลับสมาชิก เรื่องที่รอตอบนานที่สุดอยู่ด้านล่าง" />
      <Section
        title={current.label}
        description={`${rows.length} รายการ`}
        action={
          <Segmented label="กรองคำขอตามสถานะ">
            {FILTERS.map((f) => (
              <FilterLink key={f.id} href={`/admin/support?status=${f.id}`} on={status === f.id}>{f.label} <span className="num tabular-nums">({count(f.id)})</span></FilterLink>
            ))}
          </Segmented>
        }
      >
        {rows.length ? (
          <TableBox caption={`คำขอจากสมาชิก ${rows.length} รายการ`} minWidth={760}>
            <thead className="bg-panel-2">
              <tr>
                <Th>สมาชิก · เรื่อง</Th>
                <Th>ข้อความ</Th>
                <Th>ผู้รับเรื่อง</Th>
                <Th>อัปเดต</Th>
                <Th>สถานะ</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = SUPPORT_STATUS[r.status];
                return (
                  <tr key={r.id} className="border-t border-line">
                    <Td>
                      <Link href={`/admin/support/${r.id}`} className="group inline-flex min-h-11 flex-col justify-center">
                        <span className="font-medium group-hover:text-accent group-hover:underline">{r.profiles?.display_name || r.profiles?.email || "—"}</span>
                        <span className="text-xs text-muted">{requestSubject(r.kind, r.indicator_code)}</span>
                      </Link>
                    </Td>
                    <Td className="max-w-xs"><span className="block truncate text-muted">{r.message}</span></Td>
                    <Td className="whitespace-nowrap text-muted">{r.assigned_to ? "มีผู้รับเรื่องแล้ว" : "ยังไม่มีผู้รับเรื่อง"}</Td>
                    <Td className="num whitespace-nowrap text-muted tabular-nums">{fmtDateTime(r.updated_at)}</Td>
                    <Td><ToneStatus tone={st.tone}>{st.label}</ToneStatus></Td>
                  </tr>
                );
              })}
            </tbody>
          </TableBox>
        ) : (
          <EmptyLine>ไม่มีคำขอในสถานะนี้</EmptyLine>
        )}
      </Section>
    </>
  );
}
