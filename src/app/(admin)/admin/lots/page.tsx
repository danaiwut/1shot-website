import Link from "next/link";
import { BarChart3, History } from "lucide-react";
import { Row, Rows, Section, Segmented, StatRow, Status, TableBox, Td, TextLink, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink, FilterLink, Notice } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { exnessConfigured } from "@/lib/exness";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { lotsByAccount, monthStart, round2 } from "@/lib/lots";
import type { ExnessSyncRun } from "@/lib/types";
import { EmptyState, matches, one, qs, ROW_ACTION, Toolbar } from "@/components/app/toolbar";
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
  const q = one(sp.q);
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
  const top = accounts[0]?.lots || 1;
  const trading = accounts.filter((a) => a.lots > 0).length;
  const shown = accounts.filter((a) => matches(q, a.account, a.member?.display_name, a.member?.email));
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
          title={<>Lot รายบัญชี <span className="num ml-1 text-sm font-normal text-muted tabular-nums">{shown.length} บัญชี</span></>}
          description={`${fmtDate(range.from())} – ${fmtDate(new Date(new Date(range.to()).getTime() - 864e5).toISOString())}`}
        >
          <Toolbar q={q} placeholder="เลขบัญชี ชื่อ หรืออีเมล" keep={{ range: range.id }}>
            <Segmented label="ช่วงเวลา">
              {RANGES.map((r) => <FilterLink key={r.id} href={qs("/admin/lots", { range: r.id, q })} on={r.id === range.id}>{r.label}</FilterLink>)}
            </Segmented>
          </Toolbar>
          {shown.length ? (
            <TableBox minWidth={560} caption="Lot รายบัญชี Exness">
              <thead>
                <tr>
                  <Th>สมาชิก · บัญชี Exness</Th>
                  <Th className="hidden sm:table-cell">สถานะ IB</Th>
                  <Th className="text-right">Lot</Th>
                  <Th className="hidden md:table-cell">เทรดล่าสุด</Th>
                  <Th className="text-right"><span className="sr-only">เปิดโปรไฟล์</span></Th>
                </tr>
              </thead>
              <tbody>
                {shown.map((a) => (
                  <tr key={a.account} className="border-t border-line">
                    <Td>
                      {a.member ? (
                        <Link href={`/admin/members/${a.member.id}`} className="group flex min-h-11 flex-col justify-center">
                          <span className="font-bold group-hover:text-accent group-hover:underline">{a.member.display_name || a.member.email.split("@")[0]}</span>
                          <span className="num text-xs text-muted">Exness {a.account}</span>
                        </Link>
                      ) : (
                        <span className="flex min-h-11 flex-col justify-center">
                          <span className="num font-bold">{a.account}</span>
                          <span className="text-xs text-muted">ไม่พบสมาชิกที่ผูกบัญชีนี้</span>
                        </span>
                      )}
                      {a.member && <span className="mt-1 block sm:hidden"><Status tone={a.member.ib_verified ? "good" : "warn"}>{a.member.ib_verified ? "IB ยืนยันแล้ว" : "IB รอตรวจ"}</Status></span>}
                    </Td>
                    <Td className="hidden sm:table-cell">{a.member ? <Status tone={a.member.ib_verified ? "good" : "warn"}>{a.member.ib_verified ? "ยืนยันแล้ว" : "รอตรวจ"}</Status> : <span className="text-faint">—</span>}</Td>
                    <Td className="text-right">
                      <span className="num text-base font-bold tabular-nums">{a.lots.toFixed(2)}</span>
                      <span aria-hidden className="mt-1.5 ml-auto block h-1 w-24 overflow-hidden rounded-full bg-panel-3">
                        <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round((a.lots / top) * 100)}%` }} />
                      </span>
                    </Td>
                    <Td className="num hidden text-muted md:table-cell">{a.lastDay ? fmtDate(a.lastDay) : "—"}</Td>
                    <Td className="text-right">
                      {a.member && <Link href={`/admin/members/${a.member.id}`} className={ROW_ACTION}>ดูลูกค้า</Link>}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableBox>
          ) : q ? (
            <EmptyState icon={<BarChart3 />} title="ไม่พบบัญชีที่ตรงกับคำค้น" action={<TextLink href={qs("/admin/lots", { range: range.id })}>ล้างการค้นหา</TextLink>} />
          ) : (
            <EmptyState
              icon={<BarChart3 />}
              title="ยังไม่มีบัญชี Exness ในระบบ"
              action={<ButtonLink href="/admin/members?status=pending" variant="outline" className="rounded-full">ดูลูกค้าที่รอตรวจ IB</ButtonLink>}
            >
              เมื่อลูกค้ากรอกเลขบัญชี Exness ในหน้าบัญชี ยอด Lot จะขึ้นที่นี่หลังดึงข้อมูล
            </EmptyState>
          )}
        </Section>

        <Section title="ประวัติการดึงข้อมูล" description="8 ครั้งล่าสุด">
          {syncRuns.length ? (
            <Rows>
              {syncRuns.map((r) => (
                <Row key={r.id} className="flex-wrap gap-x-4 gap-y-1 text-sm">
                  <Status tone={r.ok ? "good" : r.ok === false ? "bad" : "neutral"}>{r.ok ? "สำเร็จ" : r.ok === false ? "ไม่สำเร็จ" : "กำลังทำงาน"}</Status>
                  <span className="min-w-0 flex-1">
                    <span className="num block font-semibold tabular-nums">{fmtDateTime(r.started_at)}</span>
                    <span className="block text-xs text-muted">{r.trigger === "cron" ? "อัตโนมัติ" : "กดดึงเอง"}</span>
                    {r.error && <span className="mt-0.5 block text-xs text-sell">{r.error}</span>}
                  </span>
                  <span className="num font-bold tabular-nums">{r.rows} <span className="text-xs font-normal text-muted">แถว</span></span>
                </Row>
              ))}
            </Rows>
          ) : (
            <EmptyState icon={<History />} title="ยังไม่เคยดึงข้อมูล">กด “ดึงข้อมูลตอนนี้” ด้านบน หรือรอรอบอัตโนมัติ 06:00 น.</EmptyState>
          )}
        </Section>
      </div>
    </>
  );
}
