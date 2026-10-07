import { BadgeCheck, Clock, Send } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Empty } from "@/components/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { requireViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import type { IndicatorRight } from "@/lib/types";
import { changePassword } from "../../(auth)/actions";
import { PasswordForm } from "../../(auth)/auth-form";
import { Section } from "../_components/section";
import { ProfileForm, RoomButton, TelegramLinker } from "./forms";

export const metadata = { title: "บัญชีของฉัน" };

export default async function AccountPage() {
  const { profile, supabase, userId } = await requireViewer();
  const [{ data: link }, { data: token }, { data: rights }] = await Promise.all([
    supabase.from("telegram_links").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("telegram_link_tokens").select("tg_uid, tg_name, tg_username, expires_at").eq("user_id", userId).maybeSingle(),
    supabase.from("indicator_rights").select("*, indicators(name, telegram_room_id)").eq("user_id", userId).order("code"),
  ]);
  const pending = token?.tg_uid && new Date(token.expires_at) > new Date() ? { name: token.tg_name, username: token.tg_username } : null;
  const list = (rights ?? []) as (IndicatorRight & { indicators: { name: string; telegram_room_id: string | null } | null })[];

  const name = profile.display_name || profile.email.split("@")[0];
  const ib = profile.ib_verified
    ? <Badge tone="buy"><BadgeCheck aria-hidden /> ผ่านการตรวจ IB</Badge>
    : profile.exness_account ? <Badge tone="brand"><Clock aria-hidden /> IB รอตรวจ</Badge> : undefined;

  return (
    <>
      <PageHeader
        eyebrow="ตั้งค่า"
        title={
          <span className="flex items-center gap-3">
            <Avatar className="size-11 shrink-0">
              <AvatarFallback aria-hidden className="bg-brand text-base font-bold text-white">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            บัญชีของฉัน
          </span>
        }
        description={profile.email}
        action={ib}
      />
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <Section title="ข้อมูลสมาชิก" description="ชื่อ TradingView ใช้เปิดสิทธิ์อินดิเคเตอร์ให้คุณ">
            <ProfileForm profile={profile} />
          </Section>

          <Section id="password" title="รหัสผ่าน" description="ลืมรหัสผ่านปัจจุบัน? ออกจากระบบแล้วใช้ “ลืมรหัสผ่าน” ที่หน้าเข้าสู่ระบบ" className="scroll-mt-24">
            <div className="px-6 py-6"><PasswordForm action={changePassword} email={profile.email} withCurrent submit="เปลี่ยนรหัสผ่าน" /></div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section
            id="telegram"
            title="Telegram"
            description="ใช้รับลิงก์เข้าห้องสัญญาณตามสิทธิ์ของคุณ"
            action={<Badge tone={link ? "buy" : "neutral"}>{link ? "เชื่อมแล้ว" : "ยังไม่เชื่อม"}</Badge>}
            className="scroll-mt-24"
          >
            <div className="px-6 py-6">
              {link ? (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-panel-2 p-4">
                  <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-lg bg-buy-dim text-buy"><Send className="size-4" /></span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{link.tg_name || "Telegram"}</p>
                    <p className="num truncate text-sm text-muted">{link.tg_username ? `@${link.tg_username}` : `ID ${link.tg_uid}`}</p>
                  </div>
                </div>
              ) : (
                <TelegramLinker pending={pending} />
              )}
            </div>
          </Section>

          <Section title="ห้องสัญญาณ" description="ลิงก์เข้าห้องใช้ได้ครั้งเดียว ภายใน 10 นาที">
            {!link && list.length > 0 && (
              <p className="border-b border-line bg-panel-2/40 px-6 py-3 text-sm text-muted">เชื่อม Telegram ด้านบนก่อน จึงจะขอลิงก์เข้าห้องได้</p>
            )}
            {list.length ? (
              <ul className="divide-y divide-line">
                {list.map((r) => {
                  const active = !r.expires_at || new Date(r.expires_at) > new Date();
                  return (
                    <li key={r.code} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="num grid size-10 shrink-0 place-items-center rounded-lg bg-brand-dim text-sm font-bold text-accent">{r.code}</span>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 font-medium">
                            <span className="truncate">{r.indicators?.name ?? r.code}</span>
                            <Badge tone={active ? "buy" : "neutral"}>{active ? "ใช้งานได้" : "หมดอายุ"}</Badge>
                          </p>
                          <p className="mt-0.5 text-sm text-muted">{r.expires_at ? `${active ? "ใช้ได้ถึง" : "หมดอายุ"} ${fmtDate(r.expires_at)}` : "ตลอดชีพ"}</p>
                        </div>
                      </div>
                      {r.indicators?.telegram_room_id
                        ? <RoomButton code={r.code} disabled={!active || !link} />
                        : <span className="text-sm text-muted">ไม่มีห้อง</span>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty title="ยังไม่มีสิทธิ์อินดิเคเตอร์">กรอกชื่อผู้ใช้ TradingView และบัญชี Exness แล้วรอแอดมินให้สิทธิ์</Empty>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
