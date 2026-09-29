import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, Empty, Input } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import type { Profile } from "@/lib/types";

export const metadata = { title: "สมาชิก" };

type Row = Profile & { telegram_links: { tg_username: string | null } | null; indicator_rights: { code: string; expires_at: string | null }[] };

export default async function AdminMembersPage({ searchParams }: PageProps<"/admin">) {
  const { supabase } = await requireStaff();
  const q = typeof (await searchParams).q === "string" ? String((await searchParams).q).trim() : "";
  let query = supabase
    .from("profiles")
    .select("*, telegram_links(tg_username), indicator_rights!indicator_rights_user_id_fkey(code, expires_at)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) {
    const safe = q.replace(/[%,()]/g, "");
    query = query.or(`email.ilike.%${safe}%,tradingview_username.ilike.%${safe}%,exness_account.ilike.%${safe}%,display_name.ilike.%${safe}%`);
  }
  const { data } = await query;
  const rows = (data ?? []) as Row[];
  const now = new Date();

  return (
    <>
      <PageHeader eyebrow="Admin" title="สมาชิก" description={`ทั้งหมด ${rows.length}${rows.length === 200 ? "+" : ""} คน`} />
      <form className="relative mb-4 max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
        <Input name="q" defaultValue={q} placeholder="ค้นหาอีเมล, TradingView, เลขบัญชี Exness" className="pl-9" />
      </form>
      <Card className="overflow-x-auto">
        {rows.length ? (
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line text-left text-[11px] tracking-wide text-faint uppercase">
              <tr>
                <th className="px-5 py-3 font-medium">สมาชิก</th>
                <th className="px-3 py-3 font-medium">TradingView</th>
                <th className="px-3 py-3 font-medium">Exness / IB</th>
                <th className="px-3 py-3 font-medium">Telegram</th>
                <th className="px-3 py-3 font-medium">สิทธิ์</th>
                <th className="px-5 py-3 font-medium">สมัครเมื่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const active = r.indicator_rights.filter((x) => !x.expires_at || new Date(x.expires_at) > now);
                return (
                  <tr key={r.id} className="hover:bg-panel-2">
                    <td className="px-5 py-3">
                      <Link href={`/admin/members/${r.id}`} className="block">
                        <span className="font-medium hover:text-gold-strong">{r.display_name || r.email.split("@")[0]}</span>
                        {r.role !== "member" && <Badge tone="gold" className="ml-2">{r.role}</Badge>}
                        <span className="block text-xs text-muted">{r.email}</span>
                      </Link>
                    </td>
                    <td className="num px-3 py-3 text-xs">{r.tradingview_username ?? <span className="text-faint">—</span>}</td>
                    <td className="px-3 py-3">
                      <span className="num text-xs">{r.exness_account ?? "—"}</span>
                      {r.exness_account && <Badge tone={r.ib_verified ? "buy" : "gold"} className="ml-2">{r.ib_verified ? "IB ✓" : "รอตรวจ"}</Badge>}
                    </td>
                    <td className="px-3 py-3 text-xs">{r.telegram_links ? `@${r.telegram_links.tg_username || "linked"}` : <span className="text-faint">—</span>}</td>
                    <td className="num px-3 py-3 text-xs">{active.map((x) => x.code).join(" · ") || <span className="text-faint">—</span>}</td>
                    <td className="px-5 py-3 text-xs text-muted">{fmtDate(r.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <Empty title="ไม่พบสมาชิก" />
        )}
      </Card>
    </>
  );
}
