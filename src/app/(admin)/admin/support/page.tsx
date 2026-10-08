import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { Section, Segmented, TableBox, Td, TextLink, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { cx, FilterLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime, fmtRelative } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { SupportRequest, SupportStatus } from "@/lib/types";
import { ToneStatus } from "../_components/tone-status";
import { EmptyState, matches, one, qs, ROW_ACTION, Toolbar } from "@/components/app/toolbar";

export const metadata = { title: "คำขอจากสมาชิก" };

type Row = SupportRequest & { profiles: { email: string; display_name: string | null } | null };
const FILTERS: { id: SupportStatus | "all"; label: string }[] = [
  { id: "open", label: "รอตอบ" }, { id: "answered", label: "ตอบแล้ว" }, { id: "resolved", label: "เสร็จสิ้น" }, { id: "all", label: "ทั้งหมด" },
];

export default async function AdminSupportPage({ searchParams }: PageProps<"/admin/support">) {
  const sp = await searchParams;
  const status = FILTERS.find((f) => f.id === sp.status)?.id ?? "open";
  const q = one(sp.q);
  const { supabase } = await requireStaff();
  let query = supabase.from("support_requests").select("*, profiles!support_requests_user_id_fkey(email, display_name)").order("updated_at", { ascending: false }).limit(200);
  if (status !== "all") query = query.eq("status", status);
  const [{ data }, { data: counts }] = await Promise.all([query, supabase.from("support_requests").select("status")]);
  const rows = ((data ?? []) as Row[]).filter((r) => matches(q, r.profiles?.display_name, r.profiles?.email, requestSubject(r.kind, r.indicator_code), r.message));
  const count = (s: string) => ((counts ?? []) as { status: string }[]).filter((r) => s === "all" || r.status === s).length;
  const now = Date.now();

  const current = FILTERS.find((f) => f.id === status)!;

  return (
    <>
      <PageHeader title="คำขอจากสมาชิก" description="กดเรื่องเพื่ออ่านบทสนทนาและตอบกลับ เรื่องที่รอตอบนานที่สุดอยู่ด้านล่าง" />
      <Section title={<>{current.label} <span className="num ml-1 text-sm font-normal text-muted tabular-nums">{rows.length} รายการ</span></>}>
        <Toolbar q={q} placeholder="ชื่อ อีเมล หรือข้อความ" keep={{ status }}>
          <Segmented label="กรองคำขอตามสถานะ">
            {FILTERS.map((f) => (
              <FilterLink key={f.id} href={qs("/admin/support", { status: f.id, q })} on={status === f.id}>
                {f.label} <span className="num tabular-nums opacity-70">{count(f.id)}</span>
              </FilterLink>
            ))}
          </Segmented>
        </Toolbar>
        {rows.length ? (
          <TableBox caption={`คำขอจากสมาชิก ${rows.length} รายการ`} minWidth={560}>
            <thead>
              <tr>
                <Th>สมาชิก · เรื่อง</Th>
                <Th className="hidden lg:table-cell">ข้อความ</Th>
                <Th className="hidden md:table-cell">อัปเดต</Th>
                <Th>สถานะ</Th>
                <Th className="text-right"><span className="sr-only">เปิด</span></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = SUPPORT_STATUS[r.status];
                return (
                  <tr key={r.id} className={cx("border-t border-line", r.status === "open" && "[&>td:first-child]:shadow-[inset_3px_0_0_var(--color-brand)]")}>
                    <Td>
                      <Link href={`/admin/support/${r.id}`} className="group flex min-h-11 flex-col justify-center">
                        <span className="font-bold group-hover:text-accent group-hover:underline">{r.profiles?.display_name || r.profiles?.email?.split("@")[0] || "—"}</span>
                        <span className="text-xs text-muted">
                          {requestSubject(r.kind, r.indicator_code)}
                          {!r.assigned_to && r.status !== "resolved" && <span className="font-semibold text-accent"> · ยังไม่มีผู้รับเรื่อง</span>}
                        </span>
                        <span className="mt-1 line-clamp-1 max-w-sm text-xs text-muted lg:hidden">{r.message}</span>
                      </Link>
                    </Td>
                    <Td className="hidden max-w-md lg:table-cell"><span className="line-clamp-2 text-muted">{r.message}</span></Td>
                    <Td className="hidden whitespace-nowrap md:table-cell">
                      <span className="block">{fmtRelative(r.updated_at, now)}</span>
                      <span className="num block text-xs text-muted tabular-nums">{fmtDateTime(r.updated_at)}</span>
                    </Td>
                    <Td><ToneStatus tone={st.tone}>{st.label}</ToneStatus></Td>
                    <Td className="text-right">
                      <Link href={`/admin/support/${r.id}`} className={ROW_ACTION} aria-label={`เปิดคำขอของ ${r.profiles?.display_name || r.profiles?.email || "สมาชิก"}`}>
                        {r.status === "open" ? "ตอบ" : "เปิด"} <ArrowRight aria-hidden className="size-4" />
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableBox>
        ) : q ? (
          <EmptyState icon={<Inbox />} title="ไม่พบคำขอที่ตรงกับคำค้น" action={<TextLink href={qs("/admin/support", { status })}>ล้างการค้นหา</TextLink>}>
            ลองค้นด้วยอีเมลสมาชิก หรือดูในแท็บ “ทั้งหมด”
          </EmptyState>
        ) : (
          <EmptyState
            icon={<Inbox />}
            title={status === "open" ? "ไม่มีเรื่องรอตอบ เรียบร้อยดี" : "ไม่มีคำขอในสถานะนี้"}
            action={status !== "all" && <TextLink href="/admin/support?status=all">ดูคำขอทั้งหมด</TextLink>}
          >
            {status === "open" ? "เมื่อสมาชิกส่งคำขอหรือตอบกลับ เรื่องจะขึ้นที่นี่" : undefined}
          </EmptyState>
        )}
      </Section>
    </>
  );
}
