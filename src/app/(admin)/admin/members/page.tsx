import Link from "next/link";
import { ChevronRight, KeyRound, Search } from "lucide-react";
import { EmptyLine, Section, Segmented, Status, TableBox, Td, TextLink, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Button, ButtonLink, cx, FilterLink, Input, Notice } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, ROLE_LABEL } from "@/lib/format";
import { fmtTHB } from "@/lib/store/pricing";
import type { Profile } from "@/lib/types";

export const metadata = { title: "ลูกค้า" };

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
    { key: "all", label: "ทั้งหมด", test: (_r: Row) => true },
    { key: "pending", label: "รอตรวจ IB", test: (r: Row) => Boolean(r.exness_account && !r.ib_verified) },
    { key: "active", label: "มีสิทธิ์ใช้งาน", test: hasAccess },
    { key: "expiring", label: "สิทธิ์ใกล้หมด", test: expiringSoon },
  ];
  const selected = filters.find((f) => f.key === filter) ?? filters[0];
  const rows = loaded.filter(selected.test);
  const filterHref = (status: string) => `/admin/members?${new URLSearchParams({ q, status })}`;

  return (
    <>
      <PageHeader
        title="ลูกค้า"
        description="ค้นหา กรอง แล้วกดชื่อลูกค้าเพื่อดูข้อมูลหรือให้สิทธิ์"
        action={<ButtonLink href="/admin/rights" className="h-11 rounded-full px-5"><KeyRound aria-hidden className="size-4" />ให้สิทธิ์ลูกค้า</ButtonLink>}
      />

      <div className="space-y-6">
        {error && <Notice tone="error">โหลดข้อมูลลูกค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Notice>}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented label="กรองลูกค้า" className="max-w-full">
            {filters.map((f) => <FilterLink key={f.key} href={filterHref(f.key)} on={selected.key === f.key}>{f.label} <span className="num tabular-nums">({loaded.filter(f.test).length})</span></FilterLink>)}
          </Segmented>
          <form role="search" className="flex w-full gap-2 lg:w-auto lg:min-w-96">
            <input type="hidden" name="status" value={selected.key} />
            <label htmlFor="member-q" className="sr-only">ค้นหาสมาชิก</label>
            <div className="relative flex-1">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
              <Input id="member-q" type="search" name="q" defaultValue={q} placeholder="อีเมล ชื่อ TradingView หรือเลข Exness" className="h-11 rounded-full pl-10" />
            </div>
            <Button type="submit" variant="outline" className="h-11 rounded-full px-5">ค้นหา</Button>
          </form>
        </div>

        <Section
          title={<>{selected.label} <span className="num ml-1 text-sm font-normal text-muted tabular-nums">{rows.length} คน</span></>}
          description={q ? <>ผลการค้นหา “{q}” · <Link href={`/admin/members?status=${selected.key}`} className="text-accent hover:underline">ล้าง</Link></> : "แสดงล่าสุด 200 คน"}
        >
          {rows.length ? (
            <TableBox caption={`รายชื่อสมาชิก ${rows.length} คน`} minWidth={1000}>
              <thead className="bg-panel-3/60">
                <tr>
                  <Th>ลูกค้า</Th>
                  <Th>TradingView</Th>
                  <Th>Exness / IB</Th>
                  <Th>Telegram</Th>
                  <Th>สิทธิ์ · หมดอายุถัดไป</Th>
                  <Th className="text-right">ยอดซื้อรวม</Th>
                  <Th>สมัครเมื่อ</Th>
                  <Th><span className="sr-only">ดูข้อมูล</span></Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const active = r.indicator_rights.filter((x) => !x.expires_at || new Date(x.expires_at) > now);
                  const next = nextExpiry(r);
                  const name = r.display_name || r.email.split("@")[0];
                  return (
                    <tr key={r.id} className="border-t border-line">
                      <Td>
                        <Link href={`/admin/members/${r.id}`} className="group flex min-h-11 items-center gap-3">
                          <span aria-hidden className={cx("grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold", active.length ? "bg-brand-dim text-accent" : "bg-panel-3 text-muted")}>{name.slice(0, 1).toUpperCase()}</span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2 font-bold group-hover:text-accent group-hover:underline">
                              {name}
                              {r.role !== "member" && <Badge>{ROLE_LABEL[r.role]}</Badge>}
                            </span>
                            <span className="block text-xs text-muted">{r.email}</span>
                          </span>
                        </Link>
                      </Td>
                      <Td className="num">{r.tradingview_username ?? <span className="text-faint">—</span>}</Td>
                      <Td>
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="num">{r.exness_account ?? <span className="text-faint">—</span>}</span>
                          {r.exness_account && <Status tone={r.ib_verified ? "good" : "warn"}>{r.ib_verified ? "IB ผ่าน" : "รอตรวจ"}</Status>}
                        </span>
                      </Td>
                      <Td>{r.telegram_links ? `@${r.telegram_links.tg_username || "linked"}` : <span className="text-faint">—</span>}</Td>
                      <Td>
                        {active.length ? (
                          <span className="flex flex-wrap gap-1">{active.map((x) => <span key={x.code} className="num rounded-md bg-buy-dim px-1.5 py-0.5 text-xs font-bold text-buy">{x.code}</span>)}</span>
                        ) : <span className="text-faint">ไม่มีสิทธิ์</span>}
                        {next && <span className={cx("mt-1 block text-xs", expiringSoon(r) ? "font-semibold text-accent" : "text-muted")}>ถึง {fmtDate(next)}{expiringSoon(r) && " · ใกล้หมดอายุ"}</span>}
                      </Td>
                      <Td className="num text-right font-semibold tabular-nums">{spend.get(r.id) ? fmtTHB(spend.get(r.id)!) : <span className="font-normal text-faint">—</span>}</Td>
                      <Td className="whitespace-nowrap text-muted">{fmtDate(r.created_at)}</Td>
                      <Td className="text-right">
                        <Link href={`/admin/members/${r.id}`} aria-label={`ดูข้อมูล ${name}`} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-line-strong px-3.5 text-sm font-medium whitespace-nowrap hover:border-fg">
                          ดู <ChevronRight aria-hidden className="size-4" />
                        </Link>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableBox>
          ) : (
            <EmptyLine action={<TextLink href="/admin/members">ล้างการค้นหาและตัวกรอง</TextLink>}>
              {error ? "ข้อมูลยังไม่พร้อมแสดง" : "ไม่พบลูกค้าที่ตรงกับเงื่อนไข"}
            </EmptyLine>
          )}
        </Section>
      </div>
    </>
  );
}
