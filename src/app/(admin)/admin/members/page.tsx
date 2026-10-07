import Link from "next/link";
import { EmptyLine, Section, Segmented, Status, TableBox, Td, TextLink, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Button, cx, FilterLink, Input, Notice } from "@/components/ui";
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
      <PageHeader title="ลูกค้า" description="พิมพ์ค้นหา แล้วกดชื่อลูกค้าเพื่อดูข้อมูลหรือให้สิทธิ์" />

      <div className="space-y-10">
        {error && <Notice tone="error">โหลดข้อมูลลูกค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Notice>}

        <Section
          title={<>{selected.label} <span className="num ml-1 text-sm font-normal text-muted tabular-nums">{rows.length} คน</span></>}
          description="แสดงล่าสุด 200 คน"
          action={
            <form role="search" className="flex w-full gap-2 sm:w-auto sm:min-w-80">
              <input type="hidden" name="status" value={selected.key} />
              <label htmlFor="member-q" className="sr-only">ค้นหาสมาชิก</label>
              <Input id="member-q" type="search" name="q" defaultValue={q} placeholder="อีเมล ชื่อ หรือเลขบัญชี" className="flex-1" />
              <Button type="submit" variant="outline">ค้นหา</Button>
            </form>
          }
        >
          <div className="border-b border-line px-4 py-3 sm:px-5">
            <Segmented label="กรองลูกค้า">
              {filters.map((f) => <FilterLink key={f.key} href={filterHref(f.key)} on={selected.key === f.key}>{f.label} <span className="num tabular-nums">({loaded.filter(f.test).length})</span></FilterLink>)}
            </Segmented>
          </div>
          {rows.length ? (
            <TableBox caption={`รายชื่อสมาชิก ${rows.length} คน`} minWidth={920}>
              <thead className="bg-panel-2">
                <tr>
                  <Th>สมาชิก</Th>
                  <Th>TradingView</Th>
                  <Th>Exness / IB</Th>
                  <Th>Telegram</Th>
                  <Th>สิทธิ์ · หมดอายุถัดไป</Th>
                  <Th className="text-right">ยอดซื้อรวม</Th>
                  <Th>สมัครเมื่อ</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const active = r.indicator_rights.filter((x) => !x.expires_at || new Date(x.expires_at) > now);
                  const next = nextExpiry(r);
                  return (
                    <tr key={r.id} className="border-t border-line">
                      <Td>
                        <Link href={`/admin/members/${r.id}`} className="group flex min-h-11 flex-col justify-center">
                          <span className="flex items-center gap-2 font-medium group-hover:text-accent group-hover:underline">
                            {r.display_name || r.email.split("@")[0]}
                            {r.role !== "member" && <Badge>{ROLE_LABEL[r.role]}</Badge>}
                          </span>
                          <span className="block text-xs text-muted">{r.email}</span>
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
                          <span className="num font-medium">{active.map((x) => x.code).join(" · ")}</span>
                        ) : <span className="text-faint">ไม่มีสิทธิ์</span>}
                        {next && <span className={cx("mt-0.5 block text-xs", expiringSoon(r) ? "font-semibold text-accent" : "text-muted")}>ถึง {fmtDate(next)}{expiringSoon(r) && " · ใกล้หมดอายุ"}</span>}
                      </Td>
                      <Td className="num text-right font-medium tabular-nums">{spend.get(r.id) ? fmtTHB(spend.get(r.id)!) : <span className="font-normal text-faint">—</span>}</Td>
                      <Td className="text-muted">{fmtDate(r.created_at)}</Td>
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
