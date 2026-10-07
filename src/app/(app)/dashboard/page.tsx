import Link from "next/link";
import { Check } from "lucide-react";
import { EmptyLine, Row, Rows, Section, StatRow, Status, TextLink } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { SetupRow } from "@/components/signals/setup-row";
import { ButtonLink, cx, Notice } from "@/components/ui";
import { TradingViewDialog } from "./tradingview-dialog";
import { requireViewer } from "@/lib/auth";
import { fmtDate, isOpenStatus } from "@/lib/format";
import type { IndicatorRight, Setup } from "@/lib/types";

export const metadata = { title: "ภาพรวม" };

const DAY = 864e5;
const SOON = 7 * DAY;

type Right = IndicatorRight & { indicators: { name: string } | null };

/**
 * Customer home. Read top to bottom it answers, in plain Thai:
 *   1. Can I use it right now?  2. What do I do next?  3. What do I own and until when?  4. What's new?
 */
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { password } = await searchParams;
  const { profile, supabase, userId } = await requireViewer();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

  const [rightsRes, linkRes, setupsRes, briefRes] = await Promise.all([
    supabase.from("indicator_rights").select("*, indicators(name)").eq("user_id", userId).order("code"),
    supabase.from("telegram_links").select("tg_username, tg_name").eq("user_id", userId).maybeSingle(),
    supabase.from("setups").select("*").order("updated_at", { ascending: false }).limit(6),
    supabase.from("daily_briefs").select("*").lte("brief_date", today).order("brief_date", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const now = Date.now();
  const rights = (rightsRes.data ?? []) as Right[];
  const isActive = (r: Right) => !r.expires_at || new Date(r.expires_at).getTime() > now;
  const active = rights.filter(isActive);
  const expiring = active.filter((r) => r.expires_at && new Date(r.expires_at).getTime() - now < SOON);
  const nextExpiry = active.filter((r) => r.expires_at).sort((a, b) => a.expires_at!.localeCompare(b.expires_at!))[0];
  const setups = (setupsRes.data ?? []) as Setup[];
  const open = setups.filter((s) => isOpenStatus(s.status) && !s.terminal);
  const name = profile.display_name || profile.email.split("@")[0];
  const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - now) / DAY));

  const steps = [
    { done: Boolean(profile.tradingview_username), label: "ใส่ชื่อผู้ใช้ TradingView", why: "เราใช้ชื่อนี้เปิดสิทธิ์อินดิเคเตอร์ให้คุณใน TradingView", href: "/account", cta: "กรอกชื่อ" },
    {
      done: active.length > 0, label: "เปิดสิทธิ์ใช้งาน", why: "ซื้อแพ็กเกจ หรือกรอกเลขบัญชี Exness ภายใต้ IB เพื่อขอใช้ฟรี",
      href: "/store", cta: "เลือกแพ็กเกจ",
      note: !active.length && profile.exness_account && !profile.ib_verified ? "บัญชี IB ของคุณรอแอดมินตรวจ" : undefined,
    },
    { done: Boolean(linkRes.data), label: "เชื่อม Telegram", why: "เพื่อรับลิงก์เข้าห้องสัญญาณของอินดิเคเตอร์ที่คุณมีสิทธิ์", href: "/account#telegram", cta: "เชื่อม Telegram" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);

  const tg = linkRes.data;
  const summary = active.length
    ? nextExpiry
      ? `ใช้งานได้ ${active.length} อินดิเคเตอร์ · ${nextExpiry.code} หมดอายุในอีก ${daysLeft(nextExpiry.expires_at!)} วัน`
      : `ใช้งานได้ ${active.length} อินดิเคเตอร์ · ใช้ได้ตลอดชีพ`
    : "ยังไม่มีสิทธิ์ใช้งาน ทำตามขั้นตอนด้านล่างเพื่อเริ่มรับสัญญาณ";

  return (
    <>
      <PageHeader
        title={`สวัสดี ${name}`}
        description={summary}
        action={active.length ? <ButtonLink href="/signals">ดูสัญญาณ</ButtonLink> : <ButtonLink href="/store">เลือกซื้ออินดิเคเตอร์</ButtonLink>}
      />

      <div className="space-y-10">
        {password === "updated" && <Notice tone="success">ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว</Notice>}
        {expiring.length > 0 && (
          <Notice tone="error">
            ใกล้หมดอายุภายใน 7 วัน: <b>{expiring.map((r) => r.code).join(", ")}</b> ·{" "}
            <Link href="/store" className="font-semibold underline underline-offset-4">ต่ออายุ</Link>
          </Notice>
        )}

        {active.length > 0 && (
          <StatRow
            items={[
              { label: "สิทธิ์ที่ใช้งานได้", value: active.length, hint: rights.length > active.length ? `หมดอายุแล้ว ${rights.length - active.length}` : undefined },
              { label: "หมดอายุถัดไป", value: nextExpiry ? `${daysLeft(nextExpiry.expires_at!)} วัน` : "ตลอดชีพ", hint: nextExpiry ? `${nextExpiry.code} · ${fmtDate(nextExpiry.expires_at!)}` : undefined },
              { label: "Setup ที่เปิดอยู่", value: open.length },
              { label: "Telegram", value: tg ? "เชื่อมแล้ว" : "ยังไม่เชื่อม", hint: tg?.tg_username ? `@${tg.tg_username}` : undefined },
            ]}
          />
        )}

        {next && (
          <Section title="เริ่มใช้งาน" description={`เสร็จแล้ว ${doneCount} จาก ${steps.length} ขั้นตอน`}>
            <ol className="divide-y divide-line">
              {steps.map((s, i) => {
                const current = s === next;
                return (
                  <li key={s.label} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-5">
                    <span
                      aria-hidden
                      className={cx(
                        "num grid size-7 shrink-0 place-items-center rounded-full text-sm font-semibold",
                        s.done ? "bg-buy-dim text-buy" : current ? "bg-brand text-white" : "border border-line-strong text-muted",
                      )}
                    >
                      {s.done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cx("text-sm", current ? "font-semibold" : "font-medium", s.done && "text-muted line-through decoration-line-strong")}>
                        <span className="sr-only">{s.done ? "เสร็จแล้ว: " : current ? "ขั้นตอนถัดไป: " : "ยังไม่ได้ทำ: "}</span>{s.label}
                      </p>
                      {!s.done && <p className="text-sm text-muted">{s.note ?? s.why}</p>}
                    </div>
                    {!s.done && (i === 0
                      ? <TradingViewDialog current={profile.tradingview_username} label={s.cta} />
                      : current ? <ButtonLink href={s.href} variant="outline">{s.cta}</ButtonLink> : <TextLink href={s.href}>{s.cta}</TextLink>)}
                  </li>
                );
              })}
            </ol>
          </Section>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Section title="สัญญาณล่าสุด" description={open.length ? `เปิดอยู่ ${open.length} รายการ` : undefined} action={setups.length > 0 && <TextLink href="/signals">ดูทั้งหมด</TextLink>}>
            {setups.length ? (
              <ul className="divide-y divide-line">{setups.map((s) => <li key={s.setup_key}><SetupRow s={s} /></li>)}</ul>
            ) : (
              <EmptyLine>สัญญาณจะแสดงที่นี่เมื่อคุณมีสิทธิ์อินดิเคเตอร์</EmptyLine>
            )}
          </Section>

          <Section title="อินดิเคเตอร์ของฉัน" action={rights.length > 0 && <TextLink href="/billing">ใบเสร็จ</TextLink>}>
            {rights.length ? (
              <Rows>
                {rights.map((r) => {
                  const ok = isActive(r);
                  const soon = ok && expiring.includes(r);
                  return (
                    <Row key={r.code}>
                      <span className="num w-10 shrink-0 text-sm font-semibold text-accent">{r.code}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.indicators?.name ?? r.code}</p>
                        <p className="text-sm text-muted">
                          {r.expires_at ? (ok ? `ถึง ${fmtDate(r.expires_at)} · เหลือ ${daysLeft(r.expires_at)} วัน` : `หมดอายุ ${fmtDate(r.expires_at)}`) : "ตลอดชีพ"}
                        </p>
                      </div>
                      {r.expires_at && (!ok || soon)
                        ? <TextLink href={`/indicators/${r.code}`}>ต่ออายุ</TextLink>
                        : <Status tone={ok ? "good" : "neutral"}>{ok ? "ใช้งานได้" : "หมดอายุ"}</Status>}
                    </Row>
                  );
                })}
              </Rows>
            ) : (
              <EmptyLine action={<TextLink href="/store">ไปที่ร้านค้า</TextLink>}>ยังไม่มีอินดิเคเตอร์</EmptyLine>
            )}
          </Section>
        </div>

        {briefRes.data && (
          <Section title="สรุปตลาดเช้านี้" description={fmtDate(briefRes.data.brief_date)} action={<TextLink href="/news">อ่านต่อ</TextLink>}>
            <p className="line-clamp-4 px-4 py-4 text-sm whitespace-pre-line text-muted sm:px-5">{briefRes.data.story}</p>
          </Section>
        )}
      </div>
    </>
  );
}
