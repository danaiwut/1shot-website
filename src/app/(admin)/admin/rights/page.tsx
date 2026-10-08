import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { EmptyLine, Row, Rows, Section, Status } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { cx } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { GrantForm } from "../_components/grant-form";
import { CopyName, TvDoneButton } from "./forms";

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
      who: <Link href={`/admin/members/${r.user_id}`} className="font-semibold hover:text-accent hover:underline">{r.profiles?.display_name || r.profiles?.email || "ดูข้อมูลลูกค้า"}</Link>,
      done: <TvDoneButton userId={r.user_id} code={r.code} label={`${r.code} ของ ${r.profiles?.email ?? ""}`} />,
    })),
    ...((grants ?? []) as Grant[]).filter(needsTv).map((g) => ({
      key: `g-${g.username}-${g.code}`, code: g.code, expires_at: g.expires_at, synced: Boolean(g.tv_synced_at),
      tv: g.username,
      who: <span className="text-muted">ยังไม่มีบัญชีเว็บ</span>,
      done: <TvDoneButton username={g.username} code={g.code} label={`${g.code} ของ ${g.username}`} />,
    })),
  ];

  const queueLink = (
    <a href="#tv" className={cx(
      "flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors",
      pending.length ? "border-brand/40 bg-brand-dim hover:border-brand" : "border-line bg-panel hover:border-line-strong",
    )}>
      <span className={cx("num grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums", pending.length ? "bg-brand text-white" : "bg-panel-3 text-muted")}>{pending.length}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">ต้องเปิดใน TradingView</span>
        <span className="block text-xs text-muted">{pending.length ? "ดูรายการด้านล่าง" : "ครบแล้ว ไม่มีอะไรค้าง"}</span>
      </span>
      <ArrowDown aria-hidden className="size-4 text-muted" />
    </a>
  );

  return (
    <>
      <PageHeader title="ให้สิทธิ์ลูกค้า" description="ใส่ชื่อ เลือกอินดิเคเตอร์ เลือกระยะเวลา แล้วกดให้สิทธิ์ ใช้ต่ออายุได้ด้วย" />
      <div className="space-y-12">
        <GrantForm indicators={(indicators ?? []) as { code: string; name: string }[]} who={who} extra={queueLink} />

        <Section
          id="tv"
          title={<>ต้องเปิดใน TradingView <span className="ml-1 inline-grid min-w-7 place-items-center rounded-full bg-brand px-2 text-sm text-white tabular-nums">{pending.length}</span></>}
          description="คัดลอกชื่อ → เพิ่มในอินดิเคเตอร์บน TradingView → กด “เปิดแล้ว” (ถ้าตั้งระบบอัตโนมัติไว้ รายการจะหายไปเอง)"
        >
          {pending.length ? (
            <Rows>
              {pending.map((r) => (
                <Row key={r.key} className="grid gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(10rem,14rem)_4rem_minmax(0,1fr)_auto]">
                  <div className="min-w-0">{r.tv ? <CopyName name={r.tv} /> : <Status tone="warn">ลูกค้ายังไม่กรอกชื่อ</Status>}</div>
                  <span className="num w-fit rounded-md border border-line bg-panel-2 px-2 py-0.5 text-xs font-bold sm:justify-self-end lg:justify-self-start">{r.code}</span>
                  <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                    {r.who}
                    <span>{r.expires_at ? `ถึง ${fmtDate(r.expires_at)}` : "ตลอดชีพ"}</span>
                    {r.synced && <Status tone="warn">ต้องแก้วันหมดอายุ</Status>}
                  </p>
                  <div className="sm:justify-self-end">{r.done}</div>
                </Row>
              ))}
            </Rows>
          ) : <EmptyLine>เปิดใน TradingView ครบแล้ว ไม่มีอะไรต้องทำ</EmptyLine>}
        </Section>
      </div>
    </>
  );
}
