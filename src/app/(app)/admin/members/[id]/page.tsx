import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, CardHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import type { Indicator, IndicatorRight, Profile } from "@/lib/types";
import { GrantForm, IbToggle, RevokeButton, RoleSelect, UnlinkButton } from "./controls";

export const metadata = { title: "ข้อมูลสมาชิก" };

export default async function MemberPage({ params }: PageProps<"/admin/members/[id]">) {
  const { id } = await params;
  const { supabase, profile: me } = await requireStaff();
  const [{ data: member }, { data: link }, { data: rights }, { data: indicators }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle<Profile>(),
    supabase.from("telegram_links").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("indicator_rights").select("*").eq("user_id", id).order("code"),
    supabase.from("indicators").select("*").eq("is_reference", false).order("sort"),
  ]);
  if (!member) notFound();
  const byCode = new Map(((rights ?? []) as IndicatorRight[]).map((r) => [r.code, r]));
  const now = new Date();

  return (
    <>
      <Link href="/admin" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" /> สมาชิกทั้งหมด</Link>
      <PageHeader eyebrow="Member" title={member.display_name || member.email} description={`${member.email} · สมัคร ${fmtDate(member.created_at)}`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="บัญชี" />
            <dl className="divide-y divide-line text-sm">
              <Row k="TradingView" v={<span className="num">{member.tradingview_username ?? "—"}</span>} />
              <Row k="Exness" v={<span className="num">{member.exness_account ?? "—"}</span>} />
              <Row k="ตรวจ IB" v={<IbToggle userId={member.id} verified={member.ib_verified} disabled={!member.exness_account} />} />
              <Row k="บทบาท" v={me.role === "owner" && me.id !== member.id ? <RoleSelect userId={member.id} role={member.role} /> : <Badge tone="brand">{member.role}</Badge>} />
            </dl>
          </Card>
          <Card>
            <CardHeader title="Telegram" />
            <div className="flex items-center justify-between gap-3 px-5 py-4 text-sm">
              {link ? (
                <>
                  <div>
                    <p className="font-medium">{link.tg_name || "—"}</p>
                    <p className="num text-xs text-muted">{link.tg_username ? `@${link.tg_username} · ` : ""}ID {link.tg_uid}</p>
                  </div>
                  <UnlinkButton userId={member.id} />
                </>
              ) : (
                <span className="text-muted">ยังไม่เชื่อม</span>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title="สิทธิ์อินดิเคเตอร์" hint="ไม่ได้ซิงก์กับ TradingView อัตโนมัติ ต้องให้สิทธิ์ใน TradingView ให้ตรงกันด้วย" />
          <ul className="divide-y divide-line">
            {((indicators ?? []) as Indicator[]).map((ind) => {
              const r = byCode.get(ind.code);
              const active = r && (!r.expires_at || new Date(r.expires_at) > now);
              return (
                <li key={ind.code} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-40">
                    <p className="text-sm"><span className="num mr-2 text-accent">{ind.code}</span>{ind.name}</p>
                    <p className="text-[11px] text-muted">
                      {r ? (r.expires_at ? `${active ? "ถึง" : "หมดอายุ"} ${fmtDate(r.expires_at)}` : "ตลอดชีพ") : "ไม่มีสิทธิ์"}
                      {r?.note ? ` · ${r.note}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <GrantForm userId={member.id} code={ind.code} current={r?.expires_at ?? null} has={Boolean(r)} />
                    {r && <RevokeButton userId={member.id} code={ind.code} />}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <dt className="text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
