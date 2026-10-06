import Link from "next/link";
import { Activity, ArrowRight, Check, CircleAlert, CircleCheck, Gift, Newspaper, Send, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SetupRow } from "@/components/signals/setup-row";
import { Badge, ButtonLink, Card, CardHeader, cx, Empty, Notice } from "@/components/ui";
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

  return (
    <>
      <PageHeader title={`สวัสดีคุณ${name}`} description="หน้านี้สรุปว่าบัญชีของคุณพร้อมใช้หรือยัง และต้องทำอะไรต่อ" />
      {password === "updated" && <div className="mb-6"><Notice tone="success">ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว</Notice></div>}

      {/* 1 · Status: one sentence + one obvious action */}
      <section aria-labelledby="status-title" className="surface-dark relative mb-8 overflow-hidden rounded-3xl bg-ink p-6 sm:p-8">
        <div aria-hidden className="brand-glow pointer-events-none absolute inset-0 opacity-70" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <span aria-hidden className={cx("grid size-14 shrink-0 place-items-center rounded-2xl", active.length ? "bg-buy text-black" : "bg-brand text-white")}>
              {active.length ? <CircleCheck className="size-7" /> : <CircleAlert className="size-7" />}
            </span>
            <div>
              <p className="text-sm text-muted">สถานะบัญชี</p>
              <h2 id="status-title" className="mt-0.5 text-2xl font-bold sm:text-3xl">
                {active.length ? `ใช้งานได้ ${active.length} อินดิเคเตอร์` : "ยังไม่มีสิทธิ์ใช้งาน"}
              </h2>
              <p className="mt-2 max-w-xl text-base text-muted">
                {active.length
                  ? nextExpiry
                    ? `สิทธิ์ที่จะหมดก่อนคือ ${nextExpiry.code} ในอีก ${daysLeft(nextExpiry.expires_at!)} วัน (${fmtDate(nextExpiry.expires_at!)})`
                    : "สิทธิ์ทั้งหมดของคุณใช้ได้ตลอดชีพ"
                  : "เลือกซื้ออินดิเคเตอร์เพื่อเริ่มรับสัญญาณทันที หรือขอใช้ฟรีผ่าน Exness IB"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {active.length ? (
              <>
                <ButtonLink href="/signals" className="h-12 px-6 text-base"><Activity aria-hidden className="size-5" /> ดูสัญญาณ</ButtonLink>
                <ButtonLink href="/store" variant="outline" className="h-12 px-6 text-base">ซื้อเพิ่ม / ต่ออายุ</ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink href="/store" className="h-12 px-6 text-base"><ShoppingBag aria-hidden className="size-5" /> เลือกซื้ออินดิเคเตอร์</ButtonLink>
                <ButtonLink href="/account" variant="outline" className="h-12 px-6 text-base"><Gift aria-hidden className="size-5" /> ใช้ฟรีผ่าน IB</ButtonLink>
              </>
            )}
          </div>
        </div>
        {expiring.length > 0 && (
          <p className="relative mt-6 rounded-xl border border-white/30 bg-black/40 px-4 py-3 text-sm">
            <b>ใกล้หมดอายุภายใน 7 วัน:</b> {expiring.map((r) => r.code).join(", ")} ·{" "}
            <Link href="/store" className="font-semibold underline underline-offset-4">ต่ออายุตอนนี้</Link>
          </p>
        )}
      </section>

      {/* 2 · Next steps, only while something is left to do */}
      {next && (
        <section aria-labelledby="steps-title" className="mb-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="steps-title" className="text-xl font-bold">สิ่งที่ต้องทำต่อ</h2>
            <p className="text-sm text-muted">เสร็จแล้ว {doneCount} จาก {steps.length} ขั้นตอน</p>
          </div>
          <ol className="grid gap-3 md:grid-cols-3">
            {steps.map((s, i) => {
              const current = s === next;
              return (
                <li key={s.label} className={cx("flex flex-col rounded-2xl border p-5", current ? "border-brand bg-panel shadow-[0_0_0_3px_rgb(178_0_22/0.12)]" : "border-line bg-panel")}>
                  <div className="flex items-center gap-3">
                    {s.done ? (
                      <span aria-hidden className="grid size-8 place-items-center rounded-full bg-buy text-white"><Check className="size-4" strokeWidth={3} /></span>
                    ) : (
                      <span aria-hidden className={cx("num grid size-8 place-items-center rounded-full text-sm font-bold", current ? "bg-brand text-white" : "border-2 border-line-strong")}>{i + 1}</span>
                    )}
                    <h3 className="font-semibold">
                      <span className="sr-only">{s.done ? "เสร็จแล้ว: " : current ? "ขั้นตอนถัดไป: " : "ยังไม่ได้ทำ: "}</span>
                      {s.label}
                    </h3>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-muted">{s.why}</p>
                  {s.note && <p className="mt-2 text-sm font-medium text-accent">{s.note}</p>}
                  {s.done ? (
                    <p className="mt-4 text-sm font-medium text-buy">เรียบร้อยแล้ว</p>
                  ) : (
                    <ButtonLink href={s.href} variant={current ? "brand" : "outline"} className="mt-4 w-full">{s.cta} <ArrowRight aria-hidden className="size-4" /></ButtonLink>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* 3 · What I own */}
      <section aria-labelledby="rights-title" className="mb-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="rights-title" className="text-xl font-bold">อินดิเคเตอร์ของฉัน</h2>
          <Link href="/billing" className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-4">ประวัติการซื้อและใบเสร็จ</Link>
        </div>
        {rights.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rights.map((r) => {
              const ok = isActive(r);
              const soon = ok && expiring.includes(r);
              const left = r.expires_at ? daysLeft(r.expires_at) : null;
              return (
                <li key={r.code} className={cx("rounded-2xl border bg-panel p-5", soon ? "border-brand" : "border-line")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="num grid size-11 shrink-0 place-items-center rounded-xl bg-brand-dim text-sm font-bold text-accent">{r.code}</span>
                      <p className="min-w-0 font-semibold">{r.indicators?.name ?? r.code}</p>
                    </div>
                    <Badge tone={!ok ? "neutral" : soon ? "brand" : "buy"}>{!ok ? "หมดอายุ" : soon ? "ใกล้หมด" : "ใช้งานได้"}</Badge>
                  </div>
                  <p className="mt-4 text-sm text-muted">
                    {r.expires_at ? (ok ? <>เหลืออีก <b className="text-fg">{left} วัน</b> · ถึง {fmtDate(r.expires_at)}</> : <>หมดอายุเมื่อ {fmtDate(r.expires_at)}</>) : <b className="text-fg">ใช้ได้ตลอดชีพ</b>}
                  </p>
                  {r.expires_at && (!ok || soon) && (
                    <ButtonLink href={`/indicators/${r.code}`} variant={ok ? "outline" : "brand"} className="mt-4 w-full">ต่ออายุ {r.code}</ButtonLink>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <Card><Empty title="ยังไม่มีอินดิเคเตอร์">เมื่อซื้อหรือได้รับสิทธิ์ผ่าน IB อินดิเคเตอร์จะแสดงที่นี่ พร้อมวันหมดอายุ</Empty></Card>
        )}
      </section>

      {/* 4 · What's new */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader
            title="สัญญาณล่าสุด"
            hint={open.length ? `เปิดอยู่ ${open.length} รายการ` : "ยังไม่มี Setup ที่เปิดอยู่"}
            action={<ButtonLink href="/signals" variant="ghost" className="h-11 px-3 text-sm">ดูทั้งหมด <ArrowRight aria-hidden className="size-4" /></ButtonLink>}
          />
          {setups.length ? (
            <ul className="divide-y divide-line">{setups.map((s) => <li key={s.setup_key}><SetupRow s={s} /></li>)}</ul>
          ) : (
            <Empty title="ยังไม่มีสัญญาณ">สัญญาณจะแสดงเมื่อคุณมีสิทธิ์อินดิเคเตอร์และมี Setup ใหม่เข้ามา</Empty>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-dim text-accent"><Send className="size-5" /></span>
              <div>
                <h2 className="font-semibold">ห้องสัญญาณ Telegram</h2>
                <p className="mt-1 text-sm text-muted">
                  {linkRes.data ? `เชื่อมกับ ${linkRes.data.tg_username ? `@${linkRes.data.tg_username}` : linkRes.data.tg_name ?? "Telegram"} แล้ว ขอลิงก์เข้าห้องได้ที่หน้าบัญชี` : "ยังไม่ได้เชื่อม เชื่อมก่อนเพื่อขอลิงก์เข้าห้องสัญญาณ"}
                </p>
                <Link href="/account#telegram" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-accent underline underline-offset-4">
                  {linkRes.data ? "ขอลิงก์เข้าห้อง" : "เชื่อม Telegram"}
                </Link>
              </div>
            </div>
          </Card>

          {briefRes.data && (
            <Card>
              <CardHeader title="สรุปตลาดเช้านี้" hint={fmtDate(briefRes.data.brief_date)} />
              <p className="line-clamp-6 px-5 pt-4 text-sm whitespace-pre-line text-muted">{briefRes.data.story}</p>
              <Link href="/news" className="mx-5 mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-accent underline underline-offset-4">
                <Newspaper aria-hidden className="size-4" /> อ่านสรุปเต็มและข่าว
              </Link>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
