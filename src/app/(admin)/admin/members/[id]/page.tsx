import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { KeyRound } from "lucide-react";
import { BackLink, CARD, EmptyLine, Row, Rows, Section, StatRow, Status, TableBox, Td, TextLink, Th } from "@/components/app/kit";
import { Badge, ButtonLink, cx } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, ROLE_LABEL } from "@/lib/format";
import { lotsByAccount, monthStart } from "@/lib/lots";
import { fmtTHB, ORDER_STATUS, orderTerm } from "@/lib/store/pricing";
import type { Indicator, IndicatorRight, Order, Profile, Subscription } from "@/lib/types";
import { RefundButton } from "../../orders/refund-button";
import { ToneStatus } from "../../_components/tone-status";
import { GrantForm } from "../../_components/grant-form";
import { IbToggle, RevokeButton, RoleSelect, UnlinkButton } from "./controls";

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
  const nextEnd = activeRights.filter((r) => r.expires_at).map((r) => r.expires_at!).sort()[0];
  const paid = purchases.filter((o) => o.status === "paid");
  const spent = paid.reduce((t, o) => t + o.amount_satang, 0);
  const label = member.display_name || member.email;
  const tv = member.tradingview_username;

  return (
    <>
      <BackLink href="/admin/members">ลูกค้าทั้งหมด</BackLink>

      <div className="space-y-8">
        {/* Who this is, at a glance */}
        <section className={cx(CARD, "p-5 sm:p-6")}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <span aria-hidden className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand text-2xl font-black text-white">{label.slice(0, 1).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <h1 className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-black tracking-tight sm:text-3xl">
                <span className="min-w-0 break-words">{label}</span>
                {member.role !== "member" && <Badge tone="brand">{ROLE_LABEL[member.role]}</Badge>}
              </h1>
              <p className="mt-1 text-sm break-all text-muted">{member.email} · สมัคร {fmtDate(member.created_at)}{tv && <> · TV <span className="num font-medium text-fg">{tv}</span></>}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Status tone={activeRights.length ? "good" : "neutral"}>{activeRights.length ? `มีสิทธิ์ ${activeRights.length} ตัว` : "ไม่มีสิทธิ์"}</Status>
                <Status tone={!member.exness_account ? "neutral" : member.ib_verified ? "good" : "warn"}>{!member.exness_account ? "ไม่ได้กรอก Exness" : member.ib_verified ? "IB ผ่านแล้ว" : "รอตรวจ IB"}</Status>
                <Status tone={link ? "good" : "neutral"}>{link ? "เชื่อม Telegram แล้ว" : "ยังไม่เชื่อม Telegram"}</Status>
                {liveSubs.length > 0 && <Status tone="good">สมัครรายงวดอยู่</Status>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <ButtonLink href="#grant" className="h-11 rounded-full px-5"><KeyRound aria-hidden className="size-4" />ให้ / ต่อสิทธิ์</ButtonLink>
              <ButtonLink href="#orders" variant="outline" className="h-11 rounded-full px-5">ประวัติการซื้อ</ButtonLink>
            </div>
          </div>
        </section>

        <StatRow items={[
          { label: "สิทธิ์ที่ใช้ได้", value: activeRights.length ? activeRights.map((r) => r.code).join(" · ") : "ไม่มี", hint: activeRights.length ? undefined : <Status tone="warn">ต้องดู</Status> },
          { label: "หมดอายุถัดไป", value: nextEnd ? fmtDate(nextEnd) : activeRights.length ? "ตลอดชีพ" : "—" },
          { label: "ยอดซื้อรวม", value: spent ? fmtTHB(spent) : "—", hint: `${paid.length} คำสั่งซื้อที่ชำระแล้ว` },
          { label: "Telegram", value: link ? (link.tg_username ? `@${link.tg_username}` : "เชื่อมแล้ว") : "ยังไม่เชื่อม" },
        ]} />

        <div className="grid items-start gap-8 xl:grid-cols-2">
          <Section
            title="สิทธิ์อินดิเคเตอร์"
            description="ต้องเปิดใน TradingView ให้ตรงกันด้วย ถ้ายังไม่ได้ตั้งอัตโนมัติ"
            action={<TextLink href="#grant">ให้เพิ่ม</TextLink>}
          >
            <Rows>
              {((indicators ?? []) as Indicator[]).map((ind) => {
                const r = byCode.get(ind.code);
                const active = r && (!r.expires_at || new Date(r.expires_at) > now);
                return (
                  <Row key={ind.code} className="flex-wrap gap-y-2">
                    <span className={cx("num grid h-9 w-12 shrink-0 place-items-center rounded-lg text-xs font-bold", active ? "bg-buy-dim text-buy" : "bg-panel-3 text-muted")}>{ind.code}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{ind.name}</p>
                      <p className="text-sm text-muted">
                        {r ? (r.expires_at ? `${active ? "ถึง" : "หมดอายุ"} ${fmtDate(r.expires_at)}` : "ตลอดชีพ") : "ไม่มีสิทธิ์"}
                        {r?.note ? ` · ${r.note}` : ""}
                      </p>
                    </div>
                    <Status tone={!r ? "neutral" : active ? "good" : "bad"}>{!r ? "ไม่มีสิทธิ์" : active ? "ใช้งานได้" : "หมดอายุ"}</Status>
                    {r && <RevokeButton userId={member.id} code={ind.code} />}
                  </Row>
                );
              })}
            </Rows>
          </Section>

          <div className="min-w-0 space-y-8">
            <Section title="บัญชี">
              <dl className="divide-y divide-line">
                <Info k="อีเมล"><span className="break-all">{member.email}</span></Info>
                <Info k="TradingView"><span className="num">{tv ?? "—"}</span></Info>
                <Info k="Exness"><span className="num">{member.exness_account ?? "—"}</span></Info>
                <Info k="ตรวจ IB"><IbToggle userId={member.id} verified={member.ib_verified} disabled={!member.exness_account} /></Info>
                <Info k="บทบาท">{me.role === "owner" && me.id !== member.id ? <RoleSelect userId={member.id} role={member.role} /> : ROLE_LABEL[member.role]}</Info>
              </dl>
            </Section>
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <Section title="Telegram" description={link ? "เชื่อมบัญชีแล้ว" : "ยังไม่เชื่อม"}>
                {link ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm sm:px-5">
                    <div className="min-w-0">
                      <p className="font-bold">{link.tg_name || "—"}</p>
                      <p className="num text-sm text-muted">{link.tg_username ? `@${link.tg_username} · ` : ""}ID {link.tg_uid}</p>
                    </div>
                    <UnlinkButton userId={member.id} />
                  </div>
                ) : (
                  <EmptyLine>สมาชิกยังไม่ได้เชื่อม Telegram</EmptyLine>
                )}
              </Section>
              {member.exness_account && <LotSection supabase={supabase} account={member.exness_account} />}
            </div>
          </div>
        </div>

        <Section id="grant" title="ให้หรือต่อสิทธิ์" description="ต่ออายุ ตั้งวันหมดอายุใหม่ หรือให้ตลอดชีพ ระบบส่งไป TradingView ให้ถ้าตั้งอัตโนมัติไว้" bare>
          <GrantForm
            member={{ id: member.id, label }}
            indicators={((indicators ?? []) as Indicator[]).map((ind) => {
              const r = byCode.get(ind.code);
              const status = !r ? "ไม่มีสิทธิ์" : !r.expires_at ? "ตลอดชีพ" : `${new Date(r.expires_at) > now ? "ถึง" : "หมดอายุ"} ${fmtDate(r.expires_at)}`;
              return { code: ind.code, name: ind.name, status };
            })}
          />
        </Section>

        <Section
          id="orders"
          title="การซื้อ"
          description={liveSubs.length ? `สมัครรายงวดอยู่ ${liveSubs.map((x) => x.product_name).join(", ")}` : "20 คำสั่งซื้อล่าสุด"}
          action={<TextLink href="/admin/orders">คำสั่งซื้อทั้งหมด</TextLink>}
        >
          {purchases.length ? (
            <TableBox caption="ประวัติการซื้อของสมาชิก" minWidth={640}>
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
                    <Td><span className="font-semibold">{o.product_name}</span> <span className="block text-xs text-muted">{orderTerm(o)}</span></Td>
                    <Td className="text-muted">{fmtDate(o.created_at)}</Td>
                    <Td className="num text-right font-semibold tabular-nums">{fmtTHB(o.amount_satang)}</Td>
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
