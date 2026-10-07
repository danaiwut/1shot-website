import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BackLink, EmptyLine, Row, Rows, Section, StatRow, Status, TableBox, Td, TextLink, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { Badge, ButtonLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, ROLE_LABEL } from "@/lib/format";
import { lotsByAccount, monthStart } from "@/lib/lots";
import { fmtTHB, ORDER_STATUS, orderTerm } from "@/lib/store/pricing";
import type { Indicator, IndicatorRight, Order, Profile, Subscription } from "@/lib/types";
import { RefundButton } from "../../orders/refund-button";
import { ToneStatus } from "../../_components/tone-status";
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

  const activeRights = [...byCode.values()].filter((r) => !r.expires_at || new Date(r.expires_at) > now);
  const spent = purchases.filter((o) => o.status === "paid").reduce((t, o) => t + o.amount_satang, 0);
  // At-a-glance status: the four things support asks about first. Not-OK items say so in words.
  const glance = [
    { label: "สิทธิ์ที่ใช้ได้", value: activeRights.length ? activeRights.map((r) => r.code).join(" · ") : "ไม่มี", ok: activeRights.length > 0 },
    { label: "Exness IB", value: !member.exness_account ? "ไม่ได้กรอก" : member.ib_verified ? "ตรวจผ่านแล้ว" : "รอตรวจ", ok: member.ib_verified },
    { label: "Telegram", value: link ? (link.tg_username ? `@${link.tg_username}` : "เชื่อมแล้ว") : "ยังไม่เชื่อม", ok: Boolean(link) },
    { label: "ยอดซื้อรวม", value: spent ? fmtTHB(spent) : "ยังไม่เคยซื้อ", ok: spent > 0 },
  ];
  const label = member.display_name || member.email;

  return (
    <>
      <BackLink href="/admin/members">ลูกค้าทั้งหมด</BackLink>
      <PageHeader
        title={<span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="min-w-0 break-words">{label}</span>
          {member.role !== "member" && <Badge>{ROLE_LABEL[member.role]}</Badge>}
        </span>}
        description={`${member.email} · สมัคร ${fmtDate(member.created_at)}`}
        action={<ButtonLink href={`/admin/rights?who=${encodeURIComponent(member.tradingview_username || member.email)}`}>ให้สิทธิ์ลูกค้าคนนี้</ButtonLink>}
      />

      <div className="space-y-10">
        <StatRow items={glance.map(({ label, value, ok }) => ({ label, value, hint: ok ? undefined : <Status tone="warn">ต้องดู</Status> }))} />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-10">
            <Section title="สิทธิ์อินดิเคเตอร์" description="ไม่ได้ซิงก์กับ TradingView อัตโนมัติ ต้องให้สิทธิ์ใน TradingView ให้ตรงกันด้วย">
              <Rows>
                {((indicators ?? []) as Indicator[]).map((ind) => {
                  const r = byCode.get(ind.code);
                  const active = r && (!r.expires_at || new Date(r.expires_at) > now);
                  return (
                    <Row key={ind.code} className="flex-col items-stretch gap-3 py-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="num w-10 shrink-0 text-sm font-semibold text-accent">{ind.code}</span>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium">
                            {ind.name}
                            <Status tone={!r ? "neutral" : active ? "good" : "bad"}>{!r ? "ไม่มีสิทธิ์" : active ? "ใช้งานได้" : "หมดอายุ"}</Status>
                          </p>
                          <p className="text-sm text-muted">
                            {r ? (r.expires_at ? `${active ? "ถึง" : "หมดอายุ"} ${fmtDate(r.expires_at)}` : "ตลอดชีพ") : "ไม่มีสิทธิ์"}
                            {r?.note ? ` · ${r.note}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <GrantForm userId={member.id} code={ind.code} current={r?.expires_at ?? null} has={Boolean(r)} />
                        {r && <RevokeButton userId={member.id} code={ind.code} />}
                      </div>
                    </Row>
                  );
                })}
              </Rows>
            </Section>

            <Section
              title="การซื้อ"
              description={liveSubs.length ? `สมัครรายงวดอยู่ ${liveSubs.map((x) => x.product_name).join(", ")}` : "20 คำสั่งซื้อล่าสุด"}
              action={<TextLink href="/admin/orders">คำสั่งซื้อทั้งหมด</TextLink>}
            >
              {purchases.length ? (
                <TableBox caption="ประวัติการซื้อของสมาชิก" minWidth={560}>
                  <thead className="bg-panel-2">
                    <tr>
                      <Th>สินค้า</Th>
                      <Th>วันที่</Th>
                      <Th className="text-right">ยอด</Th>
                      <Th>สถานะ</Th>
                      <Th><span className="sr-only">การจัดการ</span></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((o) => (
                      <tr key={o.id} className="border-t border-line">
                        <Td>{o.product_name} <span className="block text-xs text-muted">{orderTerm(o)}</span></Td>
                        <Td className="text-muted">{fmtDate(o.created_at)}</Td>
                        <Td className="num text-right font-medium tabular-nums">{fmtTHB(o.amount_satang)}</Td>
                        <Td><ToneStatus tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</ToneStatus></Td>
                        <Td className="text-right">{o.status === "paid" && <RefundButton orderId={o.id} label={`${fmtTHB(o.amount_satang)} · ${o.product_name}`} />}</Td>
                      </tr>
                    ))}
                  </tbody>
                </TableBox>
              ) : (
                <EmptyLine>ยังไม่เคยซื้อ</EmptyLine>
              )}
            </Section>
          </div>

          <div className="min-w-0 space-y-10">
            <Section title="บัญชี">
              <dl className="divide-y divide-line">
                <Info k="อีเมล"><span className="break-all">{member.email}</span></Info>
                <Info k="TradingView"><span className="num">{member.tradingview_username ?? "—"}</span></Info>
                <Info k="Exness"><span className="num">{member.exness_account ?? "—"}</span></Info>
                <Info k="ตรวจ IB"><IbToggle userId={member.id} verified={member.ib_verified} disabled={!member.exness_account} /></Info>
                <Info k="บทบาท">{me.role === "owner" && me.id !== member.id ? <RoleSelect userId={member.id} role={member.role} /> : ROLE_LABEL[member.role]}</Info>
              </dl>
            </Section>
            {member.exness_account && <LotSection supabase={supabase} account={member.exness_account} />}
            <Section title="Telegram" description={link ? "เชื่อมบัญชีแล้ว" : "ยังไม่เชื่อม"}>
              {link ? (
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm sm:px-5">
                  <div className="min-w-0">
                    <p className="font-medium">{link.tg_name || "—"}</p>
                    <p className="num text-sm text-muted">{link.tg_username ? `@${link.tg_username} · ` : ""}ID {link.tg_uid}</p>
                  </div>
                  <UnlinkButton userId={member.id} />
                </div>
              ) : (
                <EmptyLine>สมาชิกยังไม่ได้เชื่อม Telegram</EmptyLine>
              )}
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}

function Info({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-2.5 sm:px-5">
      <dt className="shrink-0 text-sm text-muted">{k}</dt>
      <dd className="min-w-0 text-right text-sm">{children}</dd>
    </div>
  );
}

/** This and last month's lots for the member's Exness account (from the daily partner-API sync). */
async function LotSection({ supabase, account }: { supabase: Awaited<ReturnType<typeof requireStaff>>["supabase"]; account: string }) {
  const [thisMonth, lastMonth] = await Promise.all([
    lotsByAccount(supabase, monthStart(0), monthStart(1), [account]),
    lotsByAccount(supabase, monthStart(-1), monthStart(0), [account]),
  ]);
  const cur = thisMonth.get(account), prev = lastMonth.get(account);
  return (
    <Section title="Lot Exness" action={<TextLink href="/admin/lots">ทั้งหมด</TextLink>}>
      <dl className="divide-y divide-line">
        <Info k="เดือนนี้"><span className="num font-semibold">{(cur?.lots ?? 0).toFixed(2)}</span></Info>
        <Info k="เดือนที่แล้ว"><span className="num">{(prev?.lots ?? 0).toFixed(2)}</span></Info>
        <Info k="เทรดล่าสุด"><span className="num">{cur?.lastDay ? fmtDate(cur.lastDay) : prev?.lastDay ? fmtDate(prev.lastDay) : "—"}</span></Info>
      </dl>
    </Section>
  );
}
