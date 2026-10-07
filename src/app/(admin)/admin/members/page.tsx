import Link from "next/link";
import { Clock, Radio, Search, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Badge, Button, cx, Empty, FilterLink, Input, Notice } from "@/components/ui";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaff } from "@/lib/auth";
import { fmtDate, ROLE_LABEL } from "@/lib/format";
import { fmtTHB } from "@/lib/store/pricing";
import type { Profile } from "@/lib/types";
import { Panel, Segmented, td, Th, theadRow, Toolbar } from "../_components/admin-ui";

export const metadata = { title: "สมาชิก" };

type Row = Profile & { telegram_links: { tg_username: string | null } | null; indicator_rights: { code: string; expires_at: string | null }[] };

export default async function AdminMembersPage({ searchParams }: PageProps<"/admin/members">) {
  const { supabase } = await requireStaff();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const filter = typeof params.status === "string" ? params.status : "all";
  let query = supabase
    .from("profiles")
    .select("*, telegram_links(tg_username), indicator_rights!indicator_rights_user_id_fkey(code, expires_at)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) {
    const safe = q.replace(/[%,()]/g, "");
    query = query.or(`email.ilike.%${safe}%,tradingview_username.ilike.%${safe}%,exness_account.ilike.%${safe}%,display_name.ilike.%${safe}%`);
  }
  const { data, error } = await query;
  const loaded = (data ?? []) as Row[];
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 864e5);
  const hasAccess = (r: Row) => r.indicator_rights.some((x) => !x.expires_at || new Date(x.expires_at) > now);
  const nextExpiry = (r: Row) => r.indicator_rights.filter((x) => x.expires_at && new Date(x.expires_at) > now).map((x) => x.expires_at!).sort()[0];
  const expiringSoon = (r: Row) => {
    const e = nextExpiry(r);
    return Boolean(e && new Date(e) <= soon) && !r.indicator_rights.some((x) => !x.expires_at);
  };
  // Lifetime spend per customer, for the rows on screen.
  const { data: paid } = loaded.length
    ? await supabase.from("orders").select("user_id, amount_satang").eq("status", "paid").in("user_id", loaded.map((r) => r.id))
    : { data: [] };
  const spend = new Map<string, number>();
  for (const o of (paid ?? []) as { user_id: string; amount_satang: number }[]) spend.set(o.user_id, (spend.get(o.user_id) ?? 0) + o.amount_satang);
  const filters = [
    { key: "all", label: "ลูกค้าทั้งหมด", test: (_r: Row) => true },
    { key: "pending", label: "รอตรวจ IB", test: (r: Row) => Boolean(r.exness_account && !r.ib_verified) },
    { key: "active", label: "มีสิทธิ์ใช้งาน", test: hasAccess },
    { key: "expiring", label: "ใกล้หมดอายุ 7 วัน", test: expiringSoon },
    { key: "inactive", label: "ไม่มีสิทธิ์ใช้งาน", test: (r: Row) => !hasAccess(r) },
    { key: "unlinked", label: "ยังไม่เชื่อม Telegram", test: (r: Row) => !r.telegram_links },
  ];
  const selected = filters.find((f) => f.key === filter) ?? filters[0];
  const rows = loaded.filter(selected.test);
  const filterHref = (status: string) => `/admin/members?${new URLSearchParams({ q, status })}`;

  const stats = [
    { label: "ลูกค้าที่โหลด", value: loaded.length, icon: Users, status: "all" },
    { label: "มีสิทธิ์ใช้งาน", value: loaded.filter(hasAccess).length, icon: ShieldCheck, status: "active" },
    { label: "รอตรวจสอบ IB", value: loaded.filter(filters[1].test).length, icon: Clock, status: "pending" },
    { label: "ใกล้หมดอายุ 7 วัน", value: loaded.filter(expiringSoon).length, icon: Radio, status: "expiring" },
  ];

  return (
    <>
      <PageHeader eyebrow="ระบบหลังบ้าน · ลูกค้า" title="ข้อมูลลูกค้า" description="ตรวจสอบบัญชี สิทธิ์ Indicator และการเชื่อมต่อของลูกค้าในที่เดียว" />
      {error && <div className="mb-6"><Notice tone="error">โหลดข้อมูลลูกค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Notice></div>}

      <section aria-label="สรุปลูกค้า" className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={filterHref(stat.status)} className="group block rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>[data-slot=card]]:transition-colors hover:[&>[data-slot=card]]:border-brand/40">
            <StatCard
              icon={stat.icon} label={stat.label} value={error ? "—" : stat.value} className="h-full"
              tone={stat.status === "pending" && stat.value > 0 ? "alert" : "default"}
              badge={selected.key === stat.status ? <Badge tone="brand">กำลังดู</Badge> : undefined}
              foot="จากผลค้นหาล่าสุด สูงสุด 200 คน"
            />
          </Link>
        ))}
      </section>

      <Panel
        title={<>{selected.label} <span className="num ml-1 text-sm font-normal text-muted">{rows.length} คน</span></>}
        description="คลิกชื่อลูกค้าเพื่อดูรายละเอียดและจัดการสิทธิ์"
      >
        <Toolbar>
          <Segmented label="กรองลูกค้า">
            {filters.map((f) => <FilterLink key={f.key} href={filterHref(f.key)} on={selected.key === f.key}>{f.label} <span className="num">({loaded.filter(f.test).length})</span></FilterLink>)}
          </Segmented>
          <form role="search" className="flex w-full gap-2 lg:w-auto lg:min-w-80">
            <input type="hidden" name="status" value={selected.key} />
            <label htmlFor="member-q" className="sr-only">ค้นหาสมาชิก</label>
            <span className="relative flex-1">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
              <Input id="member-q" type="search" name="q" defaultValue={q} placeholder="ชื่อ, อีเมล, TradingView หรือ Exness" className="pl-9" />
            </span>
            <Button type="submit" variant="outline">ค้นหา</Button>
          </form>
        </Toolbar>
        {rows.length ? (
          <Table className="min-w-[920px]">
            <caption className="sr-only">รายชื่อสมาชิก {rows.length} คน</caption>
            <TableHeader>
              <TableRow className={theadRow}>
                <Th>สมาชิก</Th>
                <Th>TradingView</Th>
                <Th>Exness / IB</Th>
                <Th>Telegram</Th>
                <Th>สิทธิ์ · หมดอายุถัดไป</Th>
                <Th className="text-right">ยอดซื้อรวม</Th>
                <Th>สมัครเมื่อ</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const active = r.indicator_rights.filter((x) => !x.expires_at || new Date(x.expires_at) > now);
                const next = nextExpiry(r);
                return (
                  <TableRow key={r.id} className="border-line">
                    <TableCell className={td}>
                      <Link href={`/admin/members/${r.id}`} className="group flex min-h-11 items-center gap-3">
                        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-dim text-sm font-semibold text-accent uppercase">
                          {(r.display_name || r.email).slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-medium group-hover:text-accent group-hover:underline">
                            {r.display_name || r.email.split("@")[0]}
                            {r.role !== "member" && <Badge tone="brand">{ROLE_LABEL[r.role]}</Badge>}
                          </span>
                          <span className="block text-xs text-muted">{r.email}</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className={`${td} num`}>{r.tradingview_username ?? <span className="text-faint">—</span>}</TableCell>
                    <TableCell className={td}>
                      <span className="flex items-center gap-2">
                        <span className="num">{r.exness_account ?? <span className="text-faint">—</span>}</span>
                        {r.exness_account && <Badge tone={r.ib_verified ? "buy" : "brand"}>{r.ib_verified ? "IB ผ่าน" : "รอตรวจ"}</Badge>}
                      </span>
                    </TableCell>
                    <TableCell className={td}>{r.telegram_links ? `@${r.telegram_links.tg_username || "linked"}` : <span className="text-faint">—</span>}</TableCell>
                    <TableCell className={td}>
                      {active.length ? (
                        <span className="flex flex-wrap gap-1">{active.map((x) => <Badge key={x.code} className="num">{x.code}</Badge>)}</span>
                      ) : <span className="text-faint">ไม่มีสิทธิ์</span>}
                      {next && <span className={cx("mt-1 block text-xs", expiringSoon(r) ? "font-semibold text-accent" : "text-muted")}>ถึง {fmtDate(next)}{expiringSoon(r) && " · ใกล้หมดอายุ"}</span>}
                    </TableCell>
                    <TableCell className={`${td} num text-right font-semibold`}>{spend.get(r.id) ? fmtTHB(spend.get(r.id)!) : <span className="font-normal text-faint">—</span>}</TableCell>
                    <TableCell className={`${td} text-muted`}>{fmtDate(r.created_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Empty title={error ? "ข้อมูลยังไม่พร้อมแสดง" : "ไม่พบลูกค้าที่ตรงกับเงื่อนไข"}>
            <Link href="/admin/members" className="inline-flex min-h-11 items-center font-medium text-accent underline underline-offset-4">ล้างการค้นหาและตัวกรอง</Link>
          </Empty>
        )}
      </Panel>
    </>
  );
}
