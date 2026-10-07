import { notFound } from "next/navigation";
import { BadgeCheck, Layers, Send, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, cx, Empty } from "@/components/ui";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaff } from "@/lib/auth";
import { fmtDate, ROLE_LABEL } from "@/lib/format";
import { fmtTHB, ORDER_STATUS, orderTerm } from "@/lib/store/pricing";
import type { Indicator, IndicatorRight, Order, Profile, Subscription } from "@/lib/types";
import { RefundButton } from "../../orders/refund-button";
import { BackLink, InfoRow, Panel, td, TextLink, Th, theadRow } from "../../_components/admin-ui";
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
  // At-a-glance status: the four things support asks about first. Not-OK items get an accent border and a text label.
  const glance = [
    { k: "สิทธิ์ที่ใช้ได้", v: activeRights.length ? activeRights.map((r) => r.code).join(" · ") : "ไม่มี", ok: activeRights.length > 0, icon: Layers },
    { k: "Exness IB", v: !member.exness_account ? "ไม่ได้กรอก" : member.ib_verified ? "ตรวจผ่านแล้ว" : "รอตรวจ", ok: member.ib_verified, icon: BadgeCheck },
    { k: "Telegram", v: link ? (link.tg_username ? `@${link.tg_username}` : "เชื่อมแล้ว") : "ยังไม่เชื่อม", ok: Boolean(link), icon: Send },
    { k: "ยอดซื้อรวม", v: spent ? fmtTHB(spent) : "ยังไม่เคยซื้อ", ok: spent > 0, icon: Wallet },
  ];
  const label = member.display_name || member.email;

  return (
    <>
      <BackLink href="/admin/members">สมาชิกทั้งหมด</BackLink>
      <PageHeader
        eyebrow="ข้อมูลสมาชิก"
        title={<span className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-dim text-lg font-bold text-accent uppercase">{label.slice(0, 1)}</span>
          <span className="min-w-0 break-words">{label}</span>
          {member.role !== "member" && <Badge tone="brand" className="text-sm">{ROLE_LABEL[member.role]}</Badge>}
        </span>}
        description={`${member.email} · สมัคร ${fmtDate(member.created_at)}`}
      />

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {glance.map(({ k, v, ok, icon: Icon }) => (
          <div key={k} className={cx("rounded-2xl border bg-gradient-to-t from-brand-dim/40 to-panel p-5 shadow-xs", ok ? "border-line" : "border-brand/50")}>
            <dt className="flex items-center justify-between gap-2 text-sm text-muted">
              <span className="flex items-center gap-2"><Icon aria-hidden className="size-4 text-accent" />{k}</span>
              <Badge tone={ok ? "buy" : "brand"}>{ok ? "เรียบร้อย" : "ต้องดู"}</Badge>
            </dt>
            <dd className={cx("num mt-2 text-xl font-bold break-words", !ok && "text-accent")}>{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Panel title="สิทธิ์อินดิเคเตอร์" description="ไม่ได้ซิงก์กับ TradingView อัตโนมัติ ต้องให้สิทธิ์ใน TradingView ให้ตรงกันด้วย">
            <ul className="divide-y divide-line">
              {((indicators ?? []) as Indicator[]).map((ind) => {
                const r = byCode.get(ind.code);
                const active = r && (!r.expires_at || new Date(r.expires_at) > now);
                return (
                  <li key={ind.code} className="flex flex-col gap-3 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="num grid size-10 shrink-0 place-items-center rounded-lg bg-brand-dim text-sm font-bold text-accent">{ind.code}</span>
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {ind.name}
                          <Badge tone={!r ? "neutral" : active ? "buy" : "sell"}>{!r ? "ไม่มีสิทธิ์" : active ? "ใช้งานได้" : "หมดอายุ"}</Badge>
                        </p>
                        <p className="text-xs text-muted">
                          {r ? (r.expires_at ? `${active ? "ถึง" : "หมดอายุ"} ${fmtDate(r.expires_at)}` : "ตลอดชีพ") : "ไม่มีสิทธิ์"}
                          {r?.note ? ` · ${r.note}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <GrantForm userId={member.id} code={ind.code} current={r?.expires_at ?? null} has={Boolean(r)} />
                      {r && <RevokeButton userId={member.id} code={ind.code} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel
            title="การซื้อ"
            description={liveSubs.length ? `สมัครรายงวดอยู่ ${liveSubs.map((x) => x.product_name).join(", ")}` : "20 คำสั่งซื้อล่าสุด"}
            action={<TextLink href="/admin/orders">คำสั่งซื้อทั้งหมด</TextLink>}
          >
            {purchases.length ? (
              <Table className="min-w-[560px]">
                <caption className="sr-only">ประวัติการซื้อของสมาชิก</caption>
                <TableHeader>
                  <TableRow className={theadRow}>
                    <Th>สินค้า</Th>
                    <Th>วันที่</Th>
                    <Th className="text-right">ยอด</Th>
                    <Th>สถานะ</Th>
                    <Th><span className="sr-only">การจัดการ</span></Th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((o) => (
                    <TableRow key={o.id} className="border-line">
                      <TableCell className={td}>{o.product_name} <span className="block text-xs text-muted">{orderTerm(o)}</span></TableCell>
                      <TableCell className={`${td} text-muted`}>{fmtDate(o.created_at)}</TableCell>
                      <TableCell className={`${td} num text-right font-semibold`}>{fmtTHB(o.amount_satang)}</TableCell>
                      <TableCell className={td}><Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge></TableCell>
                      <TableCell className={`${td} text-right`}>{o.status === "paid" && <RefundButton orderId={o.id} label={`${fmtTHB(o.amount_satang)} · ${o.product_name}`} />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty title="ยังไม่เคยซื้อ" />
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          <Panel title="บัญชี">
            <dl className="divide-y divide-line">
              <InfoRow k="อีเมล"><span className="break-all">{member.email}</span></InfoRow>
              <InfoRow k="TradingView"><span className="num">{member.tradingview_username ?? "—"}</span></InfoRow>
              <InfoRow k="Exness"><span className="num">{member.exness_account ?? "—"}</span></InfoRow>
              <InfoRow k="ตรวจ IB"><IbToggle userId={member.id} verified={member.ib_verified} disabled={!member.exness_account} /></InfoRow>
              <InfoRow k="บทบาท">{me.role === "owner" && me.id !== member.id ? <RoleSelect userId={member.id} role={member.role} /> : <Badge tone="brand">{ROLE_LABEL[member.role]}</Badge>}</InfoRow>
            </dl>
          </Panel>
          <Panel title="Telegram" description={link ? "เชื่อมบัญชีแล้ว" : "ยังไม่เชื่อม"}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm sm:px-6">
              {link ? (
                <>
                  <div className="min-w-0">
                    <p className="font-medium">{link.tg_name || "—"}</p>
                    <p className="num text-xs text-muted">{link.tg_username ? `@${link.tg_username} · ` : ""}ID {link.tg_uid}</p>
                  </div>
                  <UnlinkButton userId={member.id} />
                </>
              ) : (
                <span className="text-muted">สมาชิกยังไม่ได้เชื่อม Telegram</span>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
