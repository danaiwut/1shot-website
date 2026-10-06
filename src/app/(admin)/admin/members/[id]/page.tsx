import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, CardHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, ROLE_LABEL } from "@/lib/format";
import { fmtTHB, ORDER_STATUS, orderTerm } from "@/lib/store/pricing";
import type { Indicator, IndicatorRight, Order, Profile, Subscription } from "@/lib/types";
import { RefundButton } from "../../orders/refund-button";
import { GrantForm, IbToggle, RevokeButton, RoleSelect, UnlinkButton } from "./controls";

export const metadata = { title: "ข้อมูลสมาชิก" };

export default async function MemberPage({ params }: PageProps<"/admin/members/[id]">) {
  const { id } = await params;
  const { supabase, profile: me } = await requireStaff();
  const [{ data: member }, { data: link }, { data: rights }, { data: indicators }, { data: orders }, { data: subs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle<Profile>(),
    supabase.from("telegram_links").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("indicator_rights").select("*").eq("user_id", id).order("code"),
    supabase.from("indicators").select("*").eq("is_reference", false).order("sort"),
    supabase.from("orders").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("subscriptions").select("*").eq("user_id", id).in("status", ["active", "trialing", "past_due"]),
  ]);
  const purchases = (orders ?? []) as Order[];
  const liveSubs = (subs ?? []) as Subscription[];
  if (!member) notFound();
  const byCode = new Map(((rights ?? []) as IndicatorRight[]).map((r) => [r.code, r]));
  const now = new Date();

  return (
    <>
      <Link href="/admin/members" className="mb-5 inline-flex underline-offset-4 hover:underline items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" /> สมาชิกทั้งหมด</Link>
      <PageHeader eyebrow="ข้อมูลสมาชิก" title={member.display_name || member.email} description={`${member.email} · สมัคร ${fmtDate(member.created_at)}`} />

      {/* At-a-glance status: the four things support asks about first. */}
      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(() => {
          const activeRights = [...byCode.values()].filter((r) => !r.expires_at || new Date(r.expires_at) > now);
          const spent = purchases.filter((o) => o.status === "paid").reduce((t, o) => t + o.amount_satang, 0);
          const items = [
            { k: "สิทธิ์ที่ใช้ได้", v: activeRights.length ? activeRights.map((r) => r.code).join(" · ") : "ไม่มี", ok: activeRights.length > 0 },
            { k: "Exness IB", v: !member.exness_account ? "ไม่ได้กรอก" : member.ib_verified ? "ตรวจผ่านแล้ว" : "รอตรวจ", ok: member.ib_verified },
            { k: "Telegram", v: link ? (link.tg_username ? `@${link.tg_username}` : "เชื่อมแล้ว") : "ยังไม่เชื่อม", ok: Boolean(link) },
            { k: "ยอดซื้อรวม", v: spent ? fmtTHB(spent) : "ยังไม่เคยซื้อ", ok: spent > 0 },
          ];
          return items.map((i) => (
            <div key={i.k} className={`rounded-2xl border bg-panel p-4 ${i.ok ? "border-line" : "border-brand/50"}`}>
              <dt className="text-sm text-muted">{i.k}</dt>
              <dd className={`num mt-1 text-lg font-semibold ${i.ok ? "" : "text-accent"}`}>{i.v}</dd>
            </div>
          ));
        })()}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="บัญชี" />
            <dl className="divide-y divide-line text-sm">
              <Row k="TradingView" v={<span className="num">{member.tradingview_username ?? "—"}</span>} />
              <Row k="Exness" v={<span className="num">{member.exness_account ?? "—"}</span>} />
              <Row k="ตรวจ IB" v={<IbToggle userId={member.id} verified={member.ib_verified} disabled={!member.exness_account} />} />
              <Row k="บทบาท" v={me.role === "owner" && me.id !== member.id ? <RoleSelect userId={member.id} role={member.role} /> : <Badge tone="brand">{ROLE_LABEL[member.role]}</Badge>} />
            </dl>
          </Card>
          <Card>
            <CardHeader title="Telegram" />
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm sm:px-5">
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
          <Card>
            <CardHeader
              title="การซื้อ"
              hint={liveSubs.length ? `สมัครรายงวดอยู่ ${liveSubs.map((x) => x.product_name).join(", ")}` : undefined}
              action={<Link href="/admin/orders" className="text-xs text-accent underline underline-offset-4">คำสั่งซื้อทั้งหมด</Link>}
            />
            {purchases.length ? (
              <ul className="divide-y divide-line text-sm">
                {purchases.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate">{o.product_name} <span className="text-muted">· {orderTerm(o)}</span></p>
                      <p className="text-xs text-faint">{fmtDate(o.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="num text-xs font-semibold">{fmtTHB(o.amount_satang)}</span>
                      <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                      {o.status === "paid" && <RefundButton orderId={o.id} label={`${fmtTHB(o.amount_satang)} · ${o.product_name}`} />}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-muted">ยังไม่เคยซื้อ</p>
            )}
          </Card>
        </div>

        <Card>
          <CardHeader title="สิทธิ์อินดิเคเตอร์" hint="ไม่ได้ซิงก์กับ TradingView อัตโนมัติ ต้องให้สิทธิ์ใน TradingView ให้ตรงกันด้วย" />
          <ul className="divide-y divide-line">
            {((indicators ?? []) as Indicator[]).map((ind) => {
              const r = byCode.get(ind.code);
              const active = r && (!r.expires_at || new Date(r.expires_at) > now);
              return (
                <li key={ind.code} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                  <div className="min-w-40">
                    <p className="text-sm"><span className="num mr-2 text-accent">{ind.code}</span>{ind.name}</p>
                    <p className="text-xs text-muted">
                      {r ? (r.expires_at ? `${active ? "ถึง" : "หมดอายุ"} ${fmtDate(r.expires_at)}` : "ตลอดชีพ") : "ไม่มีสิทธิ์"}
                      {r?.note ? ` · ${r.note}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
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
    <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
      <dt className="text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
