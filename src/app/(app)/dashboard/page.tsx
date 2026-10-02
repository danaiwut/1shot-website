import Link from "next/link";
import { ArrowUpRight, Check, Circle } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SetupRow } from "@/components/signals/setup-row";
import { Badge, ButtonLink, Card, CardHeader, Empty } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate, isOpenStatus } from "@/lib/format";
import type { IndicatorRight, Setup } from "@/lib/types";

export const metadata = { title: "ภาพรวม" };

export default async function DashboardPage() {
  const { profile, supabase, userId } = await requireViewer();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

  const [rightsRes, linkRes, setupsRes, briefRes] = await Promise.all([
    supabase.from("indicator_rights").select("*, indicators(name)").eq("user_id", userId).order("code"),
    supabase.from("telegram_links").select("tg_username, tg_name").eq("user_id", userId).maybeSingle(),
    supabase.from("setups").select("*").order("updated_at", { ascending: false }).limit(8),
    supabase.from("daily_briefs").select("*").lte("brief_date", today).order("brief_date", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const rights = (rightsRes.data ?? []) as (IndicatorRight & { indicators: { name: string } | null })[];
  const activeRights = rights.filter((r) => !r.expires_at || new Date(r.expires_at) > new Date());
  const setups = (setupsRes.data ?? []) as Setup[];
  const open = setups.filter((s) => isOpenStatus(s.status) && !s.terminal);

  const steps = [
    { done: Boolean(profile.tradingview_username), label: "ชื่อผู้ใช้ TradingView", href: "/account" },
    {
      done: activeRights.length > 0, label: "ซื้อแพ็กเกจ หรือรับฟรีผ่าน IB", href: activeRights.length ? "/billing" : "/store",
      note: !activeRights.length && profile.exness_account && !profile.ib_verified ? "IB รอแอดมินตรวจ" : undefined,
    },
    { done: Boolean(linkRes.data), label: "เชื่อม Telegram", href: "/account#telegram" },
  ];
  const progress = steps.filter((s) => s.done).length;
  const name = profile.display_name || profile.email.split("@")[0];

  return (
    <>
      <PageHeader eyebrow="Dashboard" title={`สวัสดี, ${name}`} description="สถานะบัญชีและสัญญาณล่าสุดจากอินดิเคเตอร์ที่คุณมีสิทธิ์" />

      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <Stat label="Setup ที่เปิดอยู่" value={open.length} hint="รอเข้า / เข้าแล้ว" />
        <Stat label="อินดิเคเตอร์ที่ใช้ได้" value={activeRights.length} hint={`จากทั้งหมด ${rights.length} รายการ`} />
        <Stat label="ความพร้อมบัญชี" value={`${progress}/${steps.length}`} hint={progress === steps.length ? "พร้อมใช้งานครบ" : "ทำขั้นตอนที่เหลือให้ครบ"} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="สัญญาณล่าสุด" action={<ButtonLink href="/signals" variant="ghost" className="h-8 px-2.5 text-xs">ดูทั้งหมด <ArrowUpRight className="size-3.5" /></ButtonLink>} />
          {setups.length ? (
            <div className="divide-y divide-line">{setups.map((s) => <SetupRow key={s.setup_key} s={s} />)}</div>
          ) : (
            <Empty title="ยังไม่มีสัญญาณ">สัญญาณจะแสดงเมื่อคุณมีสิทธิ์อินดิเคเตอร์และมี Setup ใหม่เข้ามา</Empty>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="ตั้งค่าบัญชี" hint="ทำให้ครบเพื่อรับสิทธิ์เข้าห้องสัญญาณ" />
            <ul className="p-2">
              {steps.map((s) => (
                <li key={s.label}>
                  <Link href={s.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-panel-2">
                    {s.done ? (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-buy text-white"><Check className="size-3" strokeWidth={3} /></span>
                    ) : (
                      <Circle className="size-5 shrink-0 text-faint" strokeWidth={1.5} />
                    )}
                    <span className={s.done ? "text-muted line-through decoration-faint" : ""}>{s.label}</span>
                    {s.note && <Badge tone="brand" className="ml-auto">{s.note}</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {activeRights.length === 0 && (
            <div className="surface-dark relative overflow-hidden rounded-card bg-ink p-5">
              <div className="brand-glow pointer-events-none absolute inset-0 opacity-70" />
              <div className="relative">
                <p className="font-semibold">ยังไม่มีสิทธิ์อินดิเคเตอร์</p>
                <p className="mt-1 text-sm text-muted">ซื้อแพ็กเกจเพื่อเริ่มรับสัญญาณทันที หรือกรอกเลขบัญชี Exness ภายใต้ IB เพื่อขอใช้ฟรี</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ButtonLink href="/store">ดูแพ็กเกจ <ArrowUpRight className="size-4" /></ButtonLink>
                  <ButtonLink href="/account" variant="outline">ใช้ฟรีผ่าน IB</ButtonLink>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader title="สิทธิ์อินดิเคเตอร์" action={<ButtonLink href="/store" variant="ghost" className="h-8 px-2.5 text-xs">ซื้อ / ต่ออายุ</ButtonLink>} />
            {rights.length ? (
              <ul className="divide-y divide-line">
                {rights.map((r) => {
                  const active = !r.expires_at || new Date(r.expires_at) > new Date();
                  return (
                    <li key={r.code} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <span><span className="num mr-2 text-accent">{r.code}</span>{r.indicators?.name}</span>
                      <Badge tone={active ? "buy" : "neutral"}>{r.expires_at ? (active ? `ถึง ${fmtDate(r.expires_at)}` : "หมดอายุ") : "ตลอดชีพ"}</Badge>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty title="ยังไม่มีสิทธิ์">ซื้อได้ที่ร้านค้า หรือรอแอดมินให้สิทธิ์หลังตรวจบัญชี IB</Empty>
            )}
          </Card>

          {briefRes.data && (
            <Card>
              <CardHeader title="สรุปเช้า" hint={fmtDate(briefRes.data.brief_date)} action={<ButtonLink href="/news" variant="ghost" className="h-8 px-2.5 text-xs">อ่านต่อ</ButtonLink>} />
              <p className="line-clamp-6 px-5 py-4 text-sm leading-relaxed whitespace-pre-line text-muted">{briefRes.data.story}</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint: string }) {
  return (
    <Card className="p-3.5 sm:p-5">
      <p className="text-[11px] leading-snug text-muted sm:text-xs">{label}</p>
      <p className="num mt-1.5 text-2xl font-semibold sm:mt-2 sm:text-3xl">{value}</p>
      <p className="mt-1 hidden text-xs text-faint sm:block">{hint}</p>
    </Card>
  );
}
