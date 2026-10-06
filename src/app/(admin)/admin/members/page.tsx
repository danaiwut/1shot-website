import Link from "next/link";
import { ArrowUpRight, Search, Users, ShieldCheck, Clock, Radio } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Button, Card, Empty, Input, FilterLink, Notice } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, ROLE_LABEL } from "@/lib/format";
import { fmtTHB } from "@/lib/store/pricing";
import type { Profile } from "@/lib/types";

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

  return (
    <>
      <PageHeader eyebrow="ระบบหลังบ้าน · ลูกค้า" title="ข้อมูลลูกค้า" description="ตรวจสอบบัญชี สิทธิ์ Indicator และการเชื่อมต่อของลูกค้าในที่เดียว" />
      {error && <div className="mb-5"><Notice tone="error">โหลดข้อมูลลูกค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</Notice></div>}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "ลูกค้าที่โหลด", value: loaded.length, icon: Users, status: "all" },
          { label: "มีสิทธิ์ใช้งาน", value: loaded.filter(hasAccess).length, icon: ShieldCheck, status: "active" },
          { label: "รอตรวจสอบ IB", value: loaded.filter(filters[1].test).length, icon: Clock, status: "pending" },
          { label: "ใกล้หมดอายุ 7 วัน", value: loaded.filter(expiringSoon).length, icon: Radio, status: "expiring" },
        ].map((stat) => <Link key={stat.label} href={filterHref(stat.status)} className="rounded-card border border-line bg-panel p-4 transition-colors hover:border-brand/40 sm:p-5"><div className="flex items-center justify-between gap-2 text-xs text-muted">{stat.label}<stat.icon className="size-4 text-accent" /></div><p className="num mt-3 text-3xl font-semibold">{error ? "—" : stat.value}</p><p className="mt-2 text-xs text-faint">จากผลค้นหาล่าสุด สูงสุด 200 คน</p></Link>)}
      </div>
      <form role="search" className="mb-4 flex gap-2">
        <input type="hidden" name="status" value={selected.key} />
        <label htmlFor="member-q" className="sr-only">ค้นหาสมาชิก</label>
        <span className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <Input id="member-q" type="search" name="q" defaultValue={q} placeholder="ค้นหาชื่อ, อีเมล, TradingView หรือเลขบัญชี Exness" className="pl-9" />
        </span>
        <Button type="submit" variant="outline">ค้นหา</Button>
      </form>
      <div className="mb-5 flex flex-wrap gap-2">{filters.map((f) => <FilterLink key={f.key} href={filterHref(f.key)} on={selected.key === f.key}>{f.label} <span className="num">({loaded.filter(f.test).length})</span></FilterLink>)}</div>
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4"><h2 className="text-sm font-semibold">{selected.label} <span className="ml-2 text-xs font-normal text-muted">{rows.length} คน</span></h2><p className="text-xs text-muted">คลิกชื่อลูกค้าเพื่อดูรายละเอียดและจัดการสิทธิ์</p></div>
        {rows.length ? (
          <>
          <ul className="divide-y divide-line xl:hidden">
            {rows.map((r) => {
              const active = r.indicator_rights.filter((x) => !x.expires_at || new Date(x.expires_at) > now);
              return (
                <li key={r.id}>
                  <Link href={`/admin/members/${r.id}`} className="flex items-start gap-3 px-4 py-3.5 active:bg-panel-2">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-dim text-sm font-semibold text-accent uppercase">
                      {(r.display_name || r.email).slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{r.display_name || r.email.split("@")[0]}</span>
                        {r.role !== "member" && <Badge tone="brand">{ROLE_LABEL[r.role]}</Badge>}
                      </p>
                      <p className="truncate text-xs text-muted">{r.email}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.exness_account && <Badge tone={r.ib_verified ? "buy" : "brand"}>{r.ib_verified ? "IB ผ่านแล้ว" : "รอตรวจ IB"}</Badge>}
                        {r.telegram_links && <Badge>Telegram</Badge>}
                        {active.length > 0 && <Badge className="num">{active.map((x) => x.code).join(" · ")}</Badge>}
                        {expiringSoon(r) && <Badge tone="brand">ใกล้หมดอายุ</Badge>}
                        {spend.get(r.id) ? <Badge tone="buy" className="num">{fmtTHB(spend.get(r.id)!)}</Badge> : null}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-faint">{fmtDate(r.created_at)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <table className="hidden w-full text-sm xl:table">
            <caption className="sr-only">รายชื่อสมาชิก {rows.length} คน</caption>
            <thead className="border-b border-line bg-panel-2 text-left text-xs tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">สมาชิก</th>
                <th scope="col" className="px-3 py-3 font-medium">TradingView</th>
                <th scope="col" className="px-3 py-3 font-medium">Exness / IB</th>
                <th scope="col" className="px-3 py-3 font-medium">Telegram</th>
                <th scope="col" className="px-3 py-3 font-medium">สิทธิ์ · หมดอายุถัดไป</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">ยอดซื้อรวม</th>
                <th scope="col" className="px-5 py-3 font-medium">สมัครเมื่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const active = r.indicator_rights.filter((x) => !x.expires_at || new Date(x.expires_at) > now);
                return (
                  <tr key={r.id} className="hover:bg-panel-2">
                    <td className="px-5 py-3">
                      <Link href={`/admin/members/${r.id}`} className="block">
                        <span className="inline-flex items-center gap-2 font-medium hover:text-accent">{r.display_name || r.email.split("@")[0]}<ArrowUpRight className="size-3 text-faint" /></span>
                        {r.role !== "member" && <Badge tone="brand" className="ml-2">{ROLE_LABEL[r.role]}</Badge>}
                        <span className="block text-xs text-muted">{r.email}</span>
                      </Link>
                    </td>
                    <td className="num px-3 py-3 text-xs">{r.tradingview_username ?? <span className="text-faint">—</span>}</td>
                    <td className="px-3 py-3">
                      <span className="num text-xs">{r.exness_account ?? "—"}</span>
                      {r.exness_account && <Badge tone={r.ib_verified ? "buy" : "brand"} className="ml-2">{r.ib_verified ? "IB ผ่าน" : "รอตรวจ"}</Badge>}
                    </td>
                    <td className="px-3 py-3 text-xs">{r.telegram_links ? `@${r.telegram_links.tg_username || "linked"}` : <span className="text-faint">—</span>}</td>
                    <td className="px-3 py-3 text-xs">
                      <span className="num">{active.map((x) => x.code).join(" · ") || <span className="text-faint">ไม่มีสิทธิ์</span>}</span>
                      {nextExpiry(r) && <span className={`block ${expiringSoon(r) ? "font-semibold text-accent" : "text-muted"}`}>ถึง {fmtDate(nextExpiry(r)!)}</span>}
                    </td>
                    <td className="num px-3 py-3 text-right text-xs font-semibold">{spend.get(r.id) ? fmtTHB(spend.get(r.id)!) : <span className="font-normal text-faint">—</span>}</td>
                    <td className="px-5 py-3 text-xs text-muted">{fmtDate(r.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </>
        ) : (
          <Empty title={error ? "ข้อมูลยังไม่พร้อมแสดง" : "ไม่พบลูกค้าที่ตรงกับเงื่อนไข"}><Link href="/admin/members" className="text-accent underline">ล้างการค้นหาและตัวกรอง</Link></Empty>
        )}
      </Card>
    </>
  );
}
