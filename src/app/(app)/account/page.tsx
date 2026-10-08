import Link from "next/link";
import { BarChart3, Check, KeyRound, Send, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormLayout, Panel, Step } from "@/components/app/form-kit";
import { Status } from "@/components/app/kit";
import { DarkPanel, Dot, track } from "@/components/brand";
import { cx } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { lotsByAccount, monthStart } from "@/lib/lots";
import { changePassword } from "../../(auth)/actions";
import { PasswordForm } from "../../(auth)/auth-form";
import { ProfileForm, TelegramLinker } from "./forms";

export const metadata = { title: "บัญชีของฉัน" };

export default async function AccountPage() {
  const { profile, supabase, userId } = await requireViewer();
  const [{ data: link }, { data: token }] = await Promise.all([
    supabase.from("telegram_links").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("telegram_link_tokens").select("tg_uid, tg_name, tg_username, expires_at").eq("user_id", userId).maybeSingle(),
  ]);
  const account = profile.exness_account;
  const [lotsNow, lotsPrev] = account
    ? await Promise.all([lotsByAccount(supabase, monthStart(0), monthStart(1), [account]), lotsByAccount(supabase, monthStart(-1), monthStart(0), [account])])
    : [null, null];
  const pending = token?.tg_uid && new Date(token.expires_at) > new Date() ? { name: token.tg_name, username: token.tg_username } : null;
  const name = profile.display_name || profile.email.split("@")[0];

  const ib = profile.ib_verified
    ? <Status tone="good">ผ่านการตรวจ IB</Status>
    : profile.exness_account ? <Status tone="warn">IB รอตรวจ</Status> : undefined;

  const checks: { label: string; ok: boolean; line: string; href: string }[] = [
    { label: "TradingView", ok: Boolean(profile.tradingview_username), line: profile.tradingview_username ?? "ยังไม่ได้กรอก", href: "#profile" },
    { label: "Telegram", ok: Boolean(link), line: link ? (link.tg_username ? `@${link.tg_username}` : link.tg_name || "เชื่อมแล้ว") : "ยังไม่เชื่อม", href: "#telegram" },
    { label: "Exness IB", ok: profile.ib_verified, line: profile.ib_verified ? "ผ่านการตรวจแล้ว" : account ? "รอแอดมินตรวจ" : "ไม่บังคับ", href: "#profile" },
  ];
  const jump: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "#profile", label: "ข้อมูลสมาชิก", icon: UserRound },
    { href: "#telegram", label: "Telegram", icon: Send },
    ...(account ? [{ href: "#lots", label: "Lot ที่เทรด", icon: BarChart3 }] : []),
    { href: "#password", label: "รหัสผ่าน", icon: KeyRound },
  ];

  const aside = (
    <>
      <Panel title="สถานะบัญชี">
        <ul className="space-y-1">
          {checks.map((c) => (
            <li key={c.label}>
              <a href={c.href} className="flex min-h-12 items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-panel-3">
                <span aria-hidden className={cx("grid size-8 shrink-0 place-items-center rounded-full", c.ok ? "bg-buy-dim text-buy" : "bg-panel-3 text-muted")}>
                  {c.ok ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{c.label}<span className="sr-only">{c.ok ? " (เรียบร้อย)" : " (ยังไม่เสร็จ)"}</span></span>
                  <span className="num block truncate text-xs text-muted">{c.line}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="ไปที่">
        <nav aria-label="ส่วนของหน้าบัญชี" className="grid grid-cols-2 gap-2 xl:grid-cols-1">
          {jump.map((j) => (
            <a key={j.href} href={j.href} className="flex min-h-11 items-center gap-2.5 rounded-xl border border-line px-3 text-sm font-medium transition-colors hover:border-brand/50 hover:text-accent">
              <j.icon aria-hidden className="size-4 shrink-0 text-accent" /> {j.label}
            </a>
          ))}
        </nav>
        <Link href="/activity" className="mt-3 block text-center text-sm font-medium text-muted underline-offset-4 hover:text-accent hover:underline">ดูประวัติการเปลี่ยนแปลง</Link>
      </Panel>
    </>
  );

  return (
    <div className="space-y-8">
      <DarkPanel as="header" className="px-6 py-8 sm:px-10 sm:py-10">
        <div className="relative flex flex-wrap items-center gap-5">
          <span aria-hidden className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand text-2xl font-black text-white uppercase shadow-[0_16px_40px_-16px_rgb(178_0_22/0.9)] sm:size-20 sm:text-3xl">
            {name.slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold tracking-[0.18em] text-accent uppercase">My account</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight break-words sm:text-4xl">บัญชีของฉัน<Dot /></h1>
            <p className="mt-1 truncate text-sm text-muted sm:text-base">{profile.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Status tone={link ? "good" : "neutral"}>{link ? "Telegram เชื่อมแล้ว" : "ยังไม่เชื่อม Telegram"}</Status>
            {ib}
          </div>
        </div>
      </DarkPanel>

      <FormLayout aside={aside}>
        <div id="profile" className="scroll-mt-24">
          <Step n={1} title="ข้อมูลสมาชิก" hint="ชื่อ TradingView ใช้เปิดสิทธิ์อินดิเคเตอร์ให้คุณ">
            <ProfileForm profile={profile} />
          </Step>
        </div>

        <div id="telegram" className="scroll-mt-24">
          <Step
            n={2} title="Telegram"
            aside={<Status tone={link ? "good" : "neutral"}>{link ? "เชื่อมแล้ว" : "ยังไม่เชื่อม"}</Status>}
            hint={<>ใช้รับลิงก์เข้าห้องสัญญาณ ขอลิงก์ได้ที่ <Link href="/dashboard#rights" className="font-medium text-accent underline-offset-4 hover:underline">อินดิเคเตอร์ของฉัน</Link></>}
          >
            {link ? (
              <div className="flex items-center gap-4 rounded-2xl border border-line bg-panel-2 p-4">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand text-white"><Send className="size-5" /></span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{link.tg_name || "Telegram"}</p>
                  <p className="num truncate text-sm text-muted">{link.tg_username ? `@${link.tg_username}` : `ID ${link.tg_uid}`}</p>
                </div>
              </div>
            ) : (
              <TelegramLinker pending={pending} />
            )}
          </Step>
        </div>

        {account && (
          <div id="lots" className="scroll-mt-24">
            <Step title="Lot ที่เทรด (Exness)" hint={`บัญชี ${account} · อัปเดตจาก Exness วันละครั้ง`}>
              <dl className="grid grid-cols-2 gap-3">
                {[
                  { k: "เดือนนี้", v: lotsNow?.get(account)?.lots ?? 0, hot: true },
                  { k: "เดือนที่แล้ว", v: lotsPrev?.get(account)?.lots ?? 0, hot: false },
                ].map((x) => (
                  <div key={x.k} className={cx("rounded-2xl border px-5 py-4", x.hot ? "border-brand/40 bg-brand-dim" : "border-line bg-panel-2")}>
                    <dt className={cx("text-xs font-bold text-muted", track(x.k, "tracking-[0.14em]"))}>{x.k}</dt>
                    <dd className="num mt-2 text-3xl font-black tracking-tight tabular-nums">{x.v.toFixed(2)}</dd>
                    <dd className="text-xs text-muted">lot</dd>
                  </div>
                ))}
              </dl>
            </Step>
          </div>
        )}

        <div id="password" className="scroll-mt-24">
          <Step n={3} title="รหัสผ่าน" hint="ลืมรหัสผ่านปัจจุบัน? ออกจากระบบแล้วใช้ “ลืมรหัสผ่าน” ที่หน้าเข้าสู่ระบบ">
            <div className="max-w-xl [&_button[type=submit]]:rounded-full [&_button[type=submit]]:px-6">
              <PasswordForm action={changePassword} email={profile.email} withCurrent submit="เปลี่ยนรหัสผ่าน" />
            </div>
          </Step>
        </div>
      </FormLayout>
    </div>
  );
}
