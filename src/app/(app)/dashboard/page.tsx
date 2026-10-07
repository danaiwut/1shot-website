import Link from "next/link";
import { Activity, ArrowRight, CalendarClock, Check, CircleCheck, Gift, Layers, Newspaper, Send, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SetupRow } from "@/components/signals/setup-row";
import { StatCard } from "@/components/app/stat-card";
import { Badge, ButtonLink, cx, Empty, Notice } from "@/components/ui";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
    { done: Boolean(profile.tradingview_username), label: "ใส่ชื่อผู้ใช้ TradingView", why: "เราใช้ชื่อนี้เปิดสิทธิ์อินดิเคเตอร์ให้คุณใน TradingView", href: "/account", cta: "ไปกรอกชื่อ" },
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
  const pct = (r: Right) => (r.expires_at ? Math.min(100, Math.round((daysLeft(r.expires_at) / 30) * 100)) : 100);

  return (
    <>
      <PageHeader
        title={`สวัสดีคุณ${name}`}
        description="สรุปสิทธิ์ใช้งาน สัญญาณล่าสุด และสิ่งที่ต้องทำต่อของบัญชีคุณ"
        action={active.length ? (
          <>
            <ButtonLink href="/store" variant="outline">ซื้อเพิ่ม / ต่ออายุ</ButtonLink>
            <ButtonLink href="/signals"><Activity aria-hidden className="size-4" /> ดูสัญญาณ</ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href="/account" variant="outline"><Gift aria-hidden className="size-4" /> ใช้ฟรีผ่าน IB</ButtonLink>
            <ButtonLink href="/store"><ShoppingBag aria-hidden className="size-4" /> เลือกซื้ออินดิเคเตอร์</ButtonLink>
          </>
        )}
      />
      {password === "updated" && <div className="mb-6"><Notice tone="success">ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว</Notice></div>}
      {expiring.length > 0 && (
        <div className="mb-6">
          <Notice tone="error">
            <b>ใกล้หมดอายุภายใน 7 วัน:</b> {expiring.map((r) => r.code).join(", ")} ·{" "}
            <Link href="/store" className="font-semibold underline underline-offset-4">ต่ออายุตอนนี้</Link>
          </Notice>
        </div>
      )}

      {/* KPIs */}
      <section aria-label="สรุปบัญชี" className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          icon={Layers} label="สิทธิ์ที่ใช้งานได้" value={`${active.length}`}
          badge={<Badge tone={active.length ? "buy" : "neutral"}>{active.length ? "พร้อมใช้" : "ยังไม่มี"}</Badge>}
          foot={rights.length > active.length ? `หมดอายุแล้ว ${rights.length - active.length} ตัว` : "อินดิเคเตอร์ที่เปิดใช้อยู่"}
        />
        <StatCard
          icon={CalendarClock} label="หมดอายุถัดไป" tone={expiring.length ? "alert" : "default"}
          value={nextExpiry ? `${daysLeft(nextExpiry.expires_at!)} วัน` : active.length ? "ตลอดชีพ" : "—"}
          badge={nextExpiry ? <Badge tone={expiring.length ? "brand" : "neutral"}>{nextExpiry.code}</Badge> : undefined}
          foot={nextExpiry ? `ถึง ${fmtDate(nextExpiry.expires_at!)}` : "ไม่มีสิทธิ์ที่ใกล้หมดอายุ"}
        />
        <StatCard
          icon={Activity} label="Setup ที่เปิดอยู่" value={`${open.length}`}
          foot={setups.length ? `จาก ${setups.length} สัญญาณล่าสุด` : "ยังไม่มีสัญญาณ"}
        />
        <StatCard
          icon={Send} label="Telegram" value={tg ? "เชื่อมแล้ว" : "ยังไม่เชื่อม"}
          badge={<Badge tone={tg ? "buy" : "neutral"}>{tg ? "ออนไลน์" : "ปิด"}</Badge>}
          foot={tg ? (tg.tg_username ? `@${tg.tg_username}` : tg.tg_name ?? "Telegram") : <Link href="/account#telegram" className="font-medium text-accent underline underline-offset-4">เชื่อมเพื่อรับลิงก์ห้อง</Link>}
        />
      </section>

      {/* Onboarding, only while something is left to do */}
      {next && (
        <Card className="mb-6 rounded-2xl shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg">เริ่มใช้งานให้ครบ</CardTitle>
            <CardDescription className="text-muted">เสร็จแล้ว {doneCount} จาก {steps.length} ขั้นตอน</CardDescription>
            <CardAction className="hidden w-40 self-center sm:block"><Progress value={(doneCount / steps.length) * 100} aria-label={`ความคืบหน้า ${doneCount} จาก ${steps.length}`} className="h-2 bg-panel-3 [&>div]:bg-brand" /></CardAction>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-3 md:grid-cols-3">
              {steps.map((s, i) => {
                const current = s === next;
                return (
                  <li key={s.label} className={cx("flex flex-col rounded-xl border p-4", current ? "border-brand bg-brand-dim/40" : "border-line bg-panel-2")}>
                    <div className="flex items-center gap-3">
                      {s.done ? (
                        <span aria-hidden className="grid size-7 place-items-center rounded-full bg-buy text-white"><Check className="size-4" strokeWidth={3} /></span>
                      ) : (
                        <span aria-hidden className={cx("num grid size-7 place-items-center rounded-full text-sm font-bold", current ? "bg-brand text-white" : "border-2 border-line-strong")}>{i + 1}</span>
                      )}
                      <h3 className="font-semibold">
                        <span className="sr-only">{s.done ? "เสร็จแล้ว: " : current ? "ขั้นตอนถัดไป: " : "ยังไม่ได้ทำ: "}</span>
                        {s.label}
                      </h3>
                    </div>
                    <p className="mt-2 flex-1 text-sm text-muted">{s.why}</p>
                    {s.note && <p className="mt-2 text-sm font-medium text-accent">{s.note}</p>}
                    {s.done ? (
                      <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-buy"><CircleCheck aria-hidden className="size-4" /> เรียบร้อยแล้ว</p>
                    ) : (
                      <ButtonLink href={s.href} variant={current ? "brand" : "outline"} className="mt-3 w-full">{s.cta} <ArrowRight aria-hidden className="size-4" /></ButtonLink>
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* Latest signals */}
        <Card className="gap-0 overflow-hidden rounded-2xl py-0 shadow-xs">
          <CardHeader className="border-b border-line py-5">
            <CardTitle className="text-lg">สัญญาณล่าสุด</CardTitle>
            <CardDescription className="text-muted">{open.length ? `เปิดอยู่ ${open.length} รายการ` : "ยังไม่มี Setup ที่เปิดอยู่"}</CardDescription>
            <CardAction><ButtonLink href="/signals" variant="ghost">ดูทั้งหมด <ArrowRight aria-hidden className="size-4" /></ButtonLink></CardAction>
          </CardHeader>
          {setups.length ? (
            <ul className="divide-y divide-line">{setups.map((s) => <li key={s.setup_key}><SetupRow s={s} /></li>)}</ul>
          ) : (
            <Empty title="ยังไม่มีสัญญาณ">สัญญาณจะแสดงเมื่อคุณมีสิทธิ์อินดิเคเตอร์และมี Setup ใหม่เข้ามา</Empty>
          )}
        </Card>

        <div className="space-y-6">
          {/* My indicators */}
          <Card className="gap-0 rounded-2xl py-0 shadow-xs">
            <CardHeader className="border-b border-line py-5">
              <CardTitle className="text-lg">อินดิเคเตอร์ของฉัน</CardTitle>
              <CardDescription className="text-muted">{rights.length ? `${active.length} ใช้งานได้ · ${rights.length - active.length} หมดอายุ` : "ยังไม่มีสิทธิ์"}</CardDescription>
              <CardAction><ButtonLink href="/billing" variant="ghost">ใบเสร็จ</ButtonLink></CardAction>
            </CardHeader>
            {rights.length ? (
              <ul className="divide-y divide-line">
                {rights.map((r) => {
                  const ok = isActive(r);
                  const soon = ok && expiring.includes(r);
                  return (
                    <li key={r.code} className="flex items-center gap-3 px-6 py-4">
                      <span className="num grid size-10 shrink-0 place-items-center rounded-lg bg-brand-dim text-sm font-bold text-accent">{r.code}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-medium">{r.indicators?.name ?? r.code}</p>
                          <Badge tone={!ok ? "neutral" : soon ? "brand" : "buy"}>{!ok ? "หมดอายุ" : soon ? "ใกล้หมด" : "ใช้งานได้"}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted">
                          {r.expires_at ? (ok ? `เหลือ ${daysLeft(r.expires_at)} วัน · ถึง ${fmtDate(r.expires_at)}` : `หมดอายุ ${fmtDate(r.expires_at)}`) : "ใช้ได้ตลอดชีพ"}
                        </p>
                        {ok && r.expires_at && <Progress value={pct(r)} aria-hidden className={cx("mt-2 h-1.5 bg-panel-3", soon ? "[&>div]:bg-brand" : "[&>div]:bg-buy")} />}
                        {r.expires_at && (!ok || soon) && (
                          <Link href={`/indicators/${r.code}`} className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-4">ต่ออายุ {r.code}</Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty title="ยังไม่มีอินดิเคเตอร์">เมื่อซื้อหรือได้รับสิทธิ์ผ่าน IB อินดิเคเตอร์จะแสดงที่นี่ พร้อมวันหมดอายุ</Empty>
            )}
          </Card>

          {briefRes.data && (
            <Card className="rounded-2xl shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg">สรุปตลาดเช้านี้</CardTitle>
                <CardDescription className="text-muted">{fmtDate(briefRes.data.brief_date)}</CardDescription>
              </CardHeader>
              <CardContent><p className="line-clamp-6 text-sm whitespace-pre-line text-muted">{briefRes.data.story}</p></CardContent>
              <CardFooter>
                <Link href="/news" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent underline underline-offset-4"><Newspaper aria-hidden className="size-4" /> อ่านสรุปเต็มและข่าว</Link>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
