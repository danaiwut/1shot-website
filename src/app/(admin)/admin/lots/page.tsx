import Link from "next/link";
import { EmptyLine, Section, Segmented, StatRow, Status, TableBox, Td, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { FilterLink, Notice } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { exnessConfigured } from "@/lib/exness";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { lotsByAccount, monthStart, round2 } from "@/lib/lots";
import type { ExnessSyncRun } from "@/lib/types";
import { SyncButton } from "./sync-button";

export const metadata = { title: "Lot Exness" };

const RANGES = [
  { id: "this", label: "เดือนนี้", from: () => monthStart(0), to: () => monthStart(1) },
  { id: "last", label: "เดือนที่แล้ว", from: () => monthStart(-1), to: () => monthStart(0) },
  { id: "3m", label: "3 เดือน", from: () => monthStart(-2), to: () => monthStart(1) },
];

export default async function LotsPage({ searchParams }: PageProps<"/admin/lots">) {
  const sp = await searchParams;
  const range = RANGES.find((r) => r.id === sp.range) ?? RANGES[0];
  const { supabase } = await requireStaff();
  const [lots, { data: members }, { data: runs }] = await Promise.all([
    lotsByAccount(supabase, range.from(), range.to()),
    supabase.from("profiles").select("id, email, display_name, exness_account, ib_verified").not("exness_account", "is", null),
    supabase.from("exness_sync_runs").select("*").order("started_at", { ascending: false }).limit(8),
  ]);
  const people = (members ?? []) as { id: string; email: string; display_name: string | null; exness_account: string; ib_verified: boolean }[];
  const byAccount = new Map(people.map((p) => [p.exness_account, p]));
  const accounts = [...new Set([...people.map((p) => p.exness_account), ...lots.keys()])]
    .map((a) => ({ account: a, member: byAccount.get(a), ...(lots.get(a) ?? { lots: 0, lastDay: "" }) }))
    .sort((a, b) => b.lots - a.lots);
  const total = round2(accounts.reduce((s, a) => s + a.lots, 0));
  const trading = accounts.filter((a) => a.lots > 0).length;
  const syncRuns = (runs ?? []) as ExnessSyncRun[];
  const last = syncRuns[0];

  return (
    <>
      <PageHeader title="Lot Exness" description="ปริมาณการเทรดของลูกค้าภายใต้ IB ดึงจาก Exness อัตโนมัติทุกวัน 06:00 น." action={<SyncButton />} />
      <div className="space-y-10">
        {!exnessConfigured() && (
          <Notice tone="error">
            ยังไม่ได้เชื่อม Exness API — ตั้งค่า <code className="num">EXNESS_API_URL</code>, <code className="num">EXNESS_API_TOKEN</code> และ <code className="num">CRON_SECRET</code> ใน Vercel แล้ว deploy ใหม่
          </Notice>
        )}
        <StatRow
          items={[
            { label: `Lot รวม (${range.label})`, value: total.toLocaleString("en-US", { maximumFractionDigits: 2 }) },
            { label: "บัญชีที่มีการเทรด", value: `${trading} / ${accounts.length}` },
            { label: "ดึงข้อมูลล่าสุด", value: last ? (last.ok ? "สำเร็จ" : "ไม่สำเร็จ") : "—", hint: last ? fmtDateTime(last.started_at) : "ยังไม่เคยดึง" },
          ]}
        />

        <Section
          title="Lot รายบัญชี"
          description={`${fmtDate(range.from())} – ${fmtDate(new Date(new Date(range.to()).getTime() - 864e5).toISOString())}`}
          action={
            <Segmented label="ช่วงเวลา">
              {RANGES.map((r) => <FilterLink key={r.id} href={`/admin/lots?range=${r.id}`} on={r.id === range.id}>{r.label}</FilterLink>)}
            </Segmented>
          }
          bare={accounts.length > 0}
        >
          {accounts.length ? (
            <div className="overflow-hidden rounded-lg border border-line bg-panel">
              <TableBox minWidth={680} caption="Lot รายบัญชี Exness">
                <thead className="bg-panel-2">
                  <tr><Th>บัญชี Exness</Th><Th>สมาชิก</Th><Th>สถานะ IB</Th><Th className="text-right">Lot</Th><Th>เทรดล่าสุด</Th></tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.account} className="border-t border-line">
                      <Td className="num font-medium">{a.account}</Td>
                      <Td>{a.member ? <Link href={`/admin/members/${a.member.id}`} className="hover:underline">{a.member.display_name || a.member.email}</Link> : <span className="text-muted">ไม่พบสมาชิกที่ผูกบัญชีนี้</span>}</Td>
                      <Td>{a.member ? <Status tone={a.member.ib_verified ? "good" : "warn"}>{a.member.ib_verified ? "ยืนยันแล้ว" : "รอตรวจ"}</Status> : "—"}</Td>
                      <Td className="num text-right font-semibold tabular-nums">{a.lots.toFixed(2)}</Td>
                      <Td className="num text-muted">{a.lastDay ? fmtDate(a.lastDay) : "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableBox>
            </div>
          ) : <EmptyLine>ยังไม่มีบัญชี Exness ในระบบ</EmptyLine>}
        </Section>

        <Section title="ประวัติการดึงข้อมูล">
          {syncRuns.length ? (
            <ul className="divide-y divide-line">
              {syncRuns.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm sm:px-5">
                  <Status tone={r.ok ? "good" : r.ok === false ? "bad" : "neutral"}>{r.ok ? "สำเร็จ" : r.ok === false ? "ไม่สำเร็จ" : "กำลังทำงาน"}</Status>
                  <span className="num text-muted">{fmtDateTime(r.started_at)}</span>
                  <span className="text-muted">{r.trigger === "cron" ? "อัตโนมัติ" : "กดดึงเอง"}</span>
                  <span className="num">{r.rows} แถว</span>
                  {r.error && <span className="min-w-0 flex-1 text-sell">{r.error}</span>}
                </li>
              ))}
            </ul>
          ) : <EmptyLine>ยังไม่เคยดึงข้อมูล</EmptyLine>}
        </Section>
      </div>
    </>
  );
}
