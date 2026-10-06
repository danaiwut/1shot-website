import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, Empty, FilterLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { SupportRequest, SupportStatus } from "@/lib/types";

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

  return (
    <>
      <PageHeader eyebrow="ระบบหลังบ้าน" title="คำขอจากสมาชิก" description="ตรวจสอบรายละเอียดและตอบกลับสมาชิก เรื่องที่รอตอบนานที่สุดอยู่ด้านล่าง" />
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <FilterLink key={f.id} href={`/admin/support?status=${f.id}`} on={status === f.id}>{f.label} <span className="num">({count(f.id)})</span></FilterLink>
        ))}
      </div>
      <Card className="overflow-hidden">
        {rows.length ? (
          <ul className="divide-y divide-line">
            {rows.map((r) => {
              const st = SUPPORT_STATUS[r.status];
              return (
                <li key={r.id}>
                  <Link href={`/admin/support/${r.id}`} className="flex min-h-16 items-center justify-between gap-3 px-5 py-4 hover:bg-panel-2">
                    <span className="min-w-0">
                      <span className="block font-semibold">{r.profiles?.display_name || r.profiles?.email || "—"} · <span className="font-normal">{requestSubject(r.kind, r.indicator_code)}</span></span>
                      <span className="block truncate text-sm text-muted">{r.message}</span>
                      <span className="block text-xs text-faint">อัปเดต {fmtDateTime(r.updated_at)}{r.assigned_to ? " · มีผู้รับเรื่องแล้ว" : " · ยังไม่มีผู้รับเรื่อง"}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2"><Badge tone={st.tone}>{st.label}</Badge><ArrowRight aria-hidden className="size-4 text-faint" /></span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty title="ไม่มีคำขอในสถานะนี้" />
        )}
      </Card>
    </>
  );
}
