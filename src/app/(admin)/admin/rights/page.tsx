import Link from "next/link";
import { EmptyLine, Section, Status, TableBox, Td, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { requireStaff } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { CopyName, GrantForm, TvDoneButton } from "./forms";

export const metadata = { title: "ให้สิทธิ์ลูกค้า" };

type Sync = { code: string; expires_at: string | null; tv_synced_at: string | null; tv_synced_expires: string | null };
type MemberRight = Sync & { user_id: string; profiles: { email: string; display_name: string | null; tradingview_username: string | null } | null };
type Grant = Sync & { username: string };
/** TradingView needs (re)activation when never synced or the expiry changed since. */
const needsTv = (r: Sync) => !r.tv_synced_at || (r.tv_synced_expires ?? null) !== (r.expires_at ?? null);

export default async function RightsPage({ searchParams }: PageProps<"/admin/rights">) {
  const sp = await searchParams;
  const who = [sp.who, sp.email].find((x): x is string => typeof x === "string") ?? "";
  const { supabase } = await requireStaff();
  const nowIso = new Date().toISOString();
  const live = `expires_at.is.null,expires_at.gt.${nowIso}`;
  const [{ data: indicators }, { data: rights }, { data: grants }] = await Promise.all([
    supabase.from("indicators").select("code, name").eq("is_reference", false).order("sort"),
    supabase.from("indicator_rights")
      .select("user_id, code, expires_at, tv_synced_at, tv_synced_expires, profiles!indicator_rights_user_id_fkey(email, display_name, tradingview_username)")
      .or(live).order("updated_at", { ascending: false }).limit(1000),
    supabase.from("tradingview_grants").select("username, code, expires_at, tv_synced_at, tv_synced_expires").or(live).order("updated_at", { ascending: false }).limit(1000),
  ]);

  // One list for staff: member rights and username-only grants that still need opening in TradingView.
  const pending = [
    ...((rights ?? []) as unknown as MemberRight[]).filter(needsTv).map((r) => ({
      key: `m-${r.user_id}-${r.code}`, code: r.code, expires_at: r.expires_at, synced: Boolean(r.tv_synced_at),
      tv: r.profiles?.tradingview_username ?? null,
      who: <Link href={`/admin/members/${r.user_id}`} className="font-medium hover:underline">{r.profiles?.display_name || r.profiles?.email || "ดูข้อมูลลูกค้า"}</Link>,
      done: <TvDoneButton userId={r.user_id} code={r.code} label={`${r.code} ของ ${r.profiles?.email ?? ""}`} />,
    })),
    ...((grants ?? []) as Grant[]).filter(needsTv).map((g) => ({
      key: `g-${g.username}-${g.code}`, code: g.code, expires_at: g.expires_at, synced: Boolean(g.tv_synced_at),
      tv: g.username,
      who: <span className="text-muted">ยังไม่มีบัญชีเว็บ</span>,
      done: <TvDoneButton username={g.username} code={g.code} label={`${g.code} ของ ${g.username}`} />,
    })),
  ];

  return (
    <>
      <PageHeader title="ให้สิทธิ์ลูกค้า" description="ทำตาม 3 ขั้น แล้วกดให้สิทธิ์ ใช้ต่ออายุได้ด้วย" />
      <div className="max-w-4xl space-y-12">
        <GrantForm indicators={(indicators ?? []) as { code: string; name: string }[]} who={who} />

        <Section
          id="tv"
          title={`ต้องเปิดใน TradingView (${pending.length})`}
          description="คัดลอกชื่อ → ไปเพิ่มชื่อนี้ในอินดิเคเตอร์บน TradingView → กลับมากด “เปิดแล้ว” (ถ้าตั้งระบบอัตโนมัติไว้ รายการจะหายไปเอง)"
          bare={pending.length > 0}
        >
          {pending.length ? (
            <div className="overflow-hidden rounded-lg border border-line bg-panel">
              <TableBox minWidth={720} caption="สิทธิ์ที่ต้องเปิดหรืออัปเดตใน TradingView">
                <thead className="bg-panel-2">
                  <tr><Th>ชื่อ TradingView</Th><Th>อินดิเคเตอร์</Th><Th>ใช้ได้ถึง</Th><Th>ลูกค้า</Th><Th><span className="sr-only">การทำงาน</span></Th></tr>
                </thead>
                <tbody>
                  {pending.map((r) => (
                    <tr key={r.key} className="border-t border-line">
                      <Td>{r.tv ? <CopyName name={r.tv} /> : <Status tone="warn">ลูกค้ายังไม่กรอกชื่อ</Status>}</Td>
                      <Td className="num font-semibold">{r.code}{r.synced && <span className="block text-xs font-normal text-muted">ต้องแก้วันหมดอายุ</span>}</Td>
                      <Td className="num">{r.expires_at ? fmtDate(r.expires_at) : "ตลอดชีพ"}</Td>
                      <Td>{r.who}</Td>
                      <Td className="text-right">{r.done}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableBox>
            </div>
          ) : <EmptyLine>เปิดใน TradingView ครบแล้ว ไม่มีอะไรต้องทำ</EmptyLine>}
        </Section>
      </div>
    </>
  );
}
