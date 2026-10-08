import Link from "next/link";
import { ArrowRight, Check, Infinity as InfinityIcon, KeyRound, Newspaper, Radio, Send, Sparkles, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CARD, Status } from "@/components/app/kit";
import { EmptyState, ROW_ACTION } from "@/components/app/toolbar";
import { DarkPanel, Dot, SectionHeading, track } from "@/components/brand";
import { SetupRow } from "@/components/signals/setup-row";
import { cx, Notice } from "@/components/ui";
import { TradingViewDialog } from "./tradingview-dialog";
import { RoomButton } from "../account/forms";
import { requireViewer } from "@/lib/auth";
import { fmtDate, isOpenStatus } from "@/lib/format";
import { imageUrl } from "@/lib/indicators";
import type { IndicatorRight, Setup } from "@/lib/types";

export const metadata = { title: "ภาพรวม" };

const DAY = 864e5;
const SOON = 7 * DAY;
const PILL = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors";
const PILL_LIGHT = cx(PILL, "bg-fg text-ink hover:bg-brand hover:text-white");
const PILL_BRAND = cx(PILL, "bg-brand text-white shadow-[0_16px_40px_-16px_rgb(178_0_22/0.8)] hover:bg-brand-strong");
const PILL_GHOST = cx(PILL, "border border-line text-fg hover:border-brand/50 hover:text-accent");

type Right = IndicatorRight & { indicators: { name: string; family: string | null; telegram_room_id: string | null; image_path: string | null } | null };

/**
 * Customer home. Read top to bottom it answers, in plain Thai:
 *   1. Can I use it right now?  2. What do I do next?  3. What do I own and until when?  4. What's new?
 */
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { password } = await searchParams;
  const { profile, supabase, userId } = await requireViewer();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  const todayLabel = new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Bangkok" }).format(new Date());

  const [rightsRes, linkRes, setupsRes, briefRes] = await Promise.all([
    supabase.from("indicator_rights").select("*, indicators(name, family, telegram_room_id, image_path)").eq("user_id", userId).order("code"),
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

  const steps: { done: boolean; label: string; why: string; href: string; cta: string; icon: LucideIcon; note?: string }[] = [
    { done: Boolean(profile.tradingview_username), label: "ใส่ชื่อผู้ใช้ TradingView", why: "เราใช้ชื่อนี้เปิดสิทธิ์อินดิเคเตอร์ให้คุณใน TradingView", href: "/account", cta: "กรอกชื่อ", icon: UserRound },
    {
      done: active.length > 0, label: "เปิดสิทธิ์ใช้งาน", why: "ซื้อแพ็กเกจ หรือกรอกเลขบัญชี Exness ภายใต้ IB เพื่อขอใช้ฟรี",
      href: "/store", cta: "เลือกแพ็กเกจ", icon: KeyRound,
      note: !active.length && profile.exness_account && !profile.ib_verified ? "บัญชี IB ของคุณรอแอดมินตรวจ" : undefined,
    },
    { done: Boolean(linkRes.data), label: "เชื่อม Telegram", why: "เพื่อรับลิงก์เข้าห้องสัญญาณของอินดิเคเตอร์ที่คุณมีสิทธิ์", href: "/account#telegram", cta: "เชื่อม Telegram", icon: Send },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);

  const tg = linkRes.data;
  const summary = active.length
    ? nextExpiry
      ? `ใช้งานได้ ${active.length} อินดิเคเตอร์ · ${nextExpiry.code} หมดอายุในอีก ${daysLeft(nextExpiry.expires_at!)} วัน`
      : `ใช้งานได้ ${active.length} อินดิเคเตอร์ · ใช้ได้ตลอดชีพ`
    : "ยังไม่มีสิทธิ์ใช้งาน ทำตามขั้นตอนด้านล่างเพื่อเริ่มรับสัญญาณ";

  const facts = [
    { k: "สิทธิ์ที่ใช้ได้", v: active.length, h: rights.length > active.length ? `หมดอายุแล้ว ${rights.length - active.length}` : "อินดิเคเตอร์" },
    { k: "หมดอายุถัดไป", v: nextExpiry ? `${daysLeft(nextExpiry.expires_at!)} วัน` : active.length ? "ตลอดชีพ" : "—", h: nextExpiry ? nextExpiry.code : "ไม่มีวันหมด" },
    { k: "Setup เปิดอยู่", v: open.length, h: "สัญญาณล่าสุด" },
    { k: "Telegram", v: tg ? "เชื่อมแล้ว" : "ยังไม่เชื่อม", h: tg?.tg_username ? `@${tg.tg_username}` : tg ? tg.tg_name ?? "" : "รับลิงก์เข้าห้อง" },
  ];

  return (
    <div className="space-y-12">
      <DarkPanel as="header" className="px-6 py-10 sm:px-10 sm:py-12">
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="min-w-0">
            <p className={cx("text-sm font-bold text-accent", track(todayLabel, "tracking-[0.18em]"))}>{todayLabel}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight break-words sm:text-5xl">สวัสดี {name}<Dot /></h1>
            <p className="mt-3 max-w-2xl text-base text-muted sm:text-lg">{summary}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {active.length
                ? <Link href="/signals" className={PILL_LIGHT}>ดูสัญญาณ <ArrowRight aria-hidden className="size-4" /></Link>
                : <Link href="/store" className={PILL_LIGHT}>เลือกซื้ออินดิเคเตอร์ <ArrowRight aria-hidden className="size-4" /></Link>}
              <Link href={active.length ? "#rights" : "/account"} className={cx(PILL, "border border-line-strong text-fg hover:border-brand/60")}>
                {active.length ? "อินดิเคเตอร์ของฉัน" : "ตั้งค่าบัญชี"}
              </Link>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4 xl:grid-cols-2">
            {facts.map((x) => (
              <div key={x.k} className="min-w-0 bg-panel/80 px-4 py-3.5 backdrop-blur sm:px-5 xl:min-w-44">
                <dt className="text-xs font-semibold text-muted">{x.k}</dt>
                <dd className="mt-1 truncate text-xl font-black tracking-tight tabular-nums sm:text-2xl">{x.v}</dd>
                <dd className="num truncate text-xs text-muted">{x.h}</dd>
              </div>
            ))}
          </dl>
        </div>
      </DarkPanel>

      {(password === "updated" || expiring.length > 0) && (
        <div className="space-y-3">
          {password === "updated" && <Notice tone="success">ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว</Notice>}
          {expiring.length > 0 && (
            <Notice tone="error">
              ใกล้หมดอายุภายใน 7 วัน: <b>{expiring.map((r) => r.code).join(", ")}</b> ·{" "}
              <Link href="/store" className="font-semibold underline underline-offset-4">ต่ออายุ</Link>
            </Notice>
          )}
        </div>
      )}

      {next && (
        <section aria-labelledby="start-title" className={cx(CARD, "p-5 sm:p-8")}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading id="start-title" eyebrow="เริ่มใช้งาน" title="3 ขั้นตอนก็พร้อมรับสัญญาณ" size="sm" />
            <p className="text-sm font-semibold text-muted tabular-nums">เสร็จแล้ว {doneCount} จาก {steps.length}</p>
          </div>
          <div aria-hidden className="mt-5 h-2 overflow-hidden rounded-full bg-panel-3">
            <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => {
              const current = s === next;
              return (
                <li key={s.label} className={cx(
                  "flex flex-col gap-4 rounded-2xl border p-5",
                  current ? "border-brand bg-brand-dim" : s.done ? "border-line bg-panel-2" : "border-line",
                )}>
                  <div className="flex items-center gap-3">
                    <span aria-hidden className={cx(
                      "grid size-11 shrink-0 place-items-center rounded-xl",
                      s.done ? "bg-buy-dim text-buy" : current ? "bg-brand text-white shadow-[0_10px_30px_-10px_rgb(178_0_22/0.7)]" : "bg-panel-3 text-muted",
                    )}>
                      {s.done ? <Check className="size-5" strokeWidth={3} /> : <s.icon className="size-5" />}
                    </span>
                    <span className="text-xs font-bold text-muted">ขั้นที่ {i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className={cx("font-bold", s.done && "text-muted line-through decoration-line-strong")}>
                      <span className="sr-only">{s.done ? "เสร็จแล้ว: " : current ? "ขั้นตอนถัดไป: " : "ยังไม่ได้ทำ: "}</span>{s.label}
                    </p>
                    <p className="mt-1 text-sm text-muted">{s.done ? "เรียบร้อย" : s.note ?? s.why}</p>
                  </div>
                  {!s.done && (i === 0
                    ? <TradingViewDialog current={profile.tradingview_username} label={s.cta} variant={current ? "brand" : "outline"} className="h-11 w-full sm:w-auto" />
                    : <Link href={s.href} className={cx(current ? PILL_BRAND : PILL_GHOST, "w-full sm:w-auto sm:self-start")}>{s.cta}</Link>)}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section id="rights" aria-labelledby="rights-title" className="scroll-mt-24">
        <SectionHeading
          id="rights-title" eyebrow="My indicators" title="อินดิเคเตอร์ของฉัน" size="sm"
          description={rights.length && !tg
            ? <>เชื่อม Telegram ก่อน จึงจะขอลิงก์เข้าห้องได้ · <Link href="/account#telegram" className="font-semibold text-accent underline-offset-4 hover:underline">เชื่อมตอนนี้</Link></>
            : rights.length ? "ลิงก์เข้าห้องใช้ได้ครั้งเดียว ภายใน 10 นาที" : undefined}
          action={rights.length > 0 && <Link href="/store#history" className={ROW_ACTION}>ใบเสร็จ</Link>}
        />
        {rights.length ? (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {rights.map((r) => {
              const ok = isActive(r);
              const soon = ok && expiring.includes(r);
              const img = imageUrl(supabase, r.indicators?.image_path ?? null);
              return (
                <li key={r.code} className={cx(CARD, "group flex flex-col transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-brand/50", !ok && "opacity-80")}>
                  <Link href={`/store/${r.code}`} tabIndex={-1} aria-hidden className="relative block aspect-[16/9] overflow-hidden bg-ink">
                    {img
                      // eslint-disable-next-line @next/next/no-img-element -- admin-provided poster
                      ? <img src={img} alt="" loading="lazy" className={cx("size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]", !ok && "grayscale")} />
                      : <span className="grid size-full place-items-center text-5xl font-black text-white/15">{r.code}</span>}
                    {r.indicators?.family && <span className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{r.indicators.family}</span>}
                  </Link>
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 text-lg font-bold tracking-tight">
                        <Link href={`/store/${r.code}`} className="hover:text-accent">{r.indicators?.name ?? r.code}</Link>
                      </h3>
                      <span className="num shrink-0 rounded-md bg-panel-3 px-2 py-0.5 text-xs font-semibold text-muted">{r.code}</span>
                    </div>
                    <div className="flex items-end justify-between gap-3 rounded-xl bg-panel-2 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-muted">{r.expires_at ? (ok ? `ใช้ได้ถึง ${fmtDate(r.expires_at)}` : `หมดอายุ ${fmtDate(r.expires_at)}`) : "สิทธิ์การใช้"}</p>
                        <p className={cx("mt-0.5 flex items-center gap-1.5 text-xl font-black tracking-tight tabular-nums", soon && "text-accent")}>
                          {!r.expires_at ? <><InfinityIcon aria-hidden className="size-5" /> ตลอดชีพ</> : ok ? `เหลือ ${daysLeft(r.expires_at)} วัน` : "หมดอายุ"}
                        </p>
                      </div>
                      <Status tone={!ok ? "neutral" : soon ? "warn" : "good"}>{!ok ? "หมดอายุ" : soon ? "ใกล้หมด" : "ใช้งานได้"}</Status>
                    </div>
                    <div className="mt-auto flex flex-wrap items-start gap-2 [&>*]:flex-1">
                      {r.expires_at && (!ok || soon) && <Link href={`/store/${r.code}`} className={cx(ok ? PILL_GHOST : PILL_BRAND, "w-full")}>ต่ออายุ</Link>}
                      {ok && r.indicators?.telegram_room_id && <RoomButton code={r.code} disabled={!tg} block />}
                      {ok && !r.indicators?.telegram_room_id && !(r.expires_at && soon) && (
                        <Link href="/signals" className={cx(PILL_GHOST, "w-full")}>ดูสัญญาณ</Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className={cx(CARD, "mt-6")}>
            <EmptyState
              icon={<Sparkles />}
              title="ยังไม่มีอินดิเคเตอร์"
              action={<Link href="/store" className={PILL_BRAND}>ไปที่ร้านค้า <ArrowRight aria-hidden className="size-4" /></Link>}
            >
              เลือกแพ็กเกจที่ใช่ จ่ายครั้งเดียวใช้ได้ตลอดชีพ หรือขอใช้ฟรีผ่าน Exness IB ได้ที่หน้าบัญชี
            </EmptyState>
          </div>
        )}
      </section>

      <div className={cx("grid items-start gap-6", briefRes.data && "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]")}>
        <section aria-labelledby="signals-title" className="min-w-0">
          <SectionHeading
            id="signals-title" eyebrow="Signals" title="สัญญาณล่าสุด" size="sm"
            description={open.length ? `เปิดอยู่ ${open.length} รายการ` : undefined}
            action={setups.length > 0 && <Link href="/signals" className={ROW_ACTION}>ดูทั้งหมด <ArrowRight aria-hidden className="size-4" /></Link>}
          />
          <div className={cx(CARD, "mt-6")}>
            {setups.length ? (
              <ul className="divide-y divide-line">{setups.map((s) => <li key={s.setup_key}><SetupRow s={s} /></li>)}</ul>
            ) : (
              <EmptyState
                icon={<Radio />}
                title="ยังไม่มีสัญญาณ"
                action={!active.length && <Link href="/store" className={PILL_GHOST}>เลือกซื้ออินดิเคเตอร์</Link>}
              >
                สัญญาณจะแสดงที่นี่เมื่อคุณมีสิทธิ์อินดิเคเตอร์
              </EmptyState>
            )}
          </div>
        </section>

        {briefRes.data && (
          <section aria-labelledby="brief-title" className="min-w-0">
            <article className="relative overflow-hidden rounded-2xl border border-line bg-ink p-6 text-fg shadow-[0_30px_80px_-40px_rgb(178_0_22/0.35)] dark:border-white/10 sm:p-7">
              <div aria-hidden className="pointer-events-none absolute -top-20 -right-10 size-64 rounded-full bg-brand/10 dark:bg-brand/30 blur-[90px]" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span aria-hidden className="grid size-11 place-items-center rounded-xl bg-brand text-white"><Newspaper className="size-5" /></span>
                  <div>
                    <p className="text-xs font-bold tracking-[0.14em] text-accent uppercase">Morning brief</p>
                    <h2 id="brief-title" className="text-lg font-black tracking-tight">สรุปตลาดเช้านี้<Dot /></h2>
                  </div>
                </div>
                <p className="mt-1 pl-14 text-xs text-muted">{fmtDate(briefRes.data.brief_date)}</p>
                <p className="mt-5 line-clamp-6 text-sm leading-7 whitespace-pre-line text-muted">{briefRes.data.story}</p>
                <Link href="/news" className={cx(PILL_LIGHT, "mt-6")}>อ่านต่อ <ArrowRight aria-hidden className="size-4" /></Link>
              </div>
            </article>
          </section>
        )}
      </div>
    </div>
  );
}
