import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Section, Segmented, TableBox, Td, TextLink, Th } from "@/components/app/kit";
import { FilterLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { describeAudit } from "@/lib/support";
import type { AuditEntry } from "@/lib/types";
import { EmptyState, matches, qs, Toolbar } from "@/components/app/toolbar";

type Row = AuditEntry & {
  subject: { email: string; display_name: string | null } | null;
  actor: { email: string; display_name: string | null } | null;
};
const FILTERS = [
  { id: "all", label: "ทั้งหมด", prefix: "" }, { id: "rights", label: "สิทธิ์ Indicator", prefix: "right." },
  { id: "role", label: "บทบาท / ทีมงาน", prefix: "role." }, { id: "ib", label: "Exness IB", prefix: "ib." }, { id: "support", label: "คำขอ", prefix: "support." },
];

export async function AccessTab({ type, q = "" }: { type?: string | string[]; q?: string }) {
  const f = FILTERS.find((x) => x.id === type) ?? FILTERS[0];
  const { supabase } = await requireStaff();
  let query = supabase.from("audit_log")
    .select("*, subject:profiles!audit_log_subject_id_fkey(email, display_name), actor:profiles!audit_log_actor_id_fkey(email, display_name)")
    .order("created_at", { ascending: false }).limit(200);
  if (f.prefix) query = query.like("action", `${f.prefix}%`);
  const { data } = await query;
  const who = (p: Row["actor"]) => p?.display_name || p?.email || "—";
  const rows = ((data ?? []) as Row[]).map((e) => ({ e, d: describeAudit(e) }))
    .filter(({ e, d }) => matches(q, d.title, d.detail, e.subject?.email, e.subject?.display_name, e.actor?.email, e.actor?.display_name));

  return (
    <Section title={<>{f.label} <span className="num ml-1 text-sm font-normal text-muted tabular-nums">{rows.length} รายการ</span></>}>
      <Toolbar q={q} placeholder="ชื่อ อีเมล หรือการกระทำ" keep={{ tab: "access", type: f.id }}>
        <Segmented label="กรองประวัติตามประเภท">
          {FILTERS.map((x) => <FilterLink key={x.id} href={qs("/admin/logs", { tab: "access", type: x.id, q })} on={f.id === x.id}>{x.label}</FilterLink>)}
        </Segmented>
      </Toolbar>
      {rows.length ? (
        <TableBox caption={`ประวัติการจัดการสิทธิ์ ${rows.length} รายการ`} minWidth={600}>
          <thead>
            <tr>
              <Th>การกระทำ</Th>
              <Th>สมาชิก</Th>
              <Th className="hidden md:table-cell">โดย</Th>
              <Th className="hidden lg:table-cell">เวลา</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ e, d }) => (
              <tr key={e.id} className="border-t border-line align-top">
                <Td>
                  <span className="block font-bold">{d.title}</span>
                  {d.detail && <span className="block max-w-md text-xs text-muted">{d.detail}</span>}
                  <span className="mt-0.5 block text-xs text-muted lg:hidden">
                    <time dateTime={e.created_at} className="num">{fmtDateTime(e.created_at)}</time>
                    <span className="md:hidden"> · โดย {e.actor_id ? who(e.actor) : "ระบบ"}</span>
                  </span>
                </Td>
                <Td>
                  {e.subject_id ? <Link href={`/admin/members/${e.subject_id}`} className="inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:text-accent hover:underline">{who(e.subject)}</Link> : <span className="text-faint">—</span>}
                </Td>
                <Td className="hidden md:table-cell">
                  {e.actor_id ? who(e.actor) : <span className="text-muted">ระบบ (การชำระเงิน / อัตโนมัติ)</span>}
                </Td>
                <Td className="num hidden whitespace-nowrap text-muted tabular-nums lg:table-cell"><time dateTime={e.created_at}>{fmtDateTime(e.created_at)}</time></Td>
              </tr>
            ))}
          </tbody>
        </TableBox>
      ) : (
        <EmptyState
          icon={<ShieldCheck />}
          title={q ? "ไม่พบประวัติที่ตรงกับคำค้น" : "ยังไม่มีประวัติในหมวดนี้"}
          action={(q || f.id !== "all") && <TextLink href="/admin/logs?tab=access">ล้างตัวกรองและการค้นหา</TextLink>}
        />
      )}
    </Section>
  );
}
