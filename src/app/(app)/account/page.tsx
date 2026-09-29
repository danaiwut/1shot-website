import { BadgeCheck, Clock } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, CardHeader, Empty } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import type { IndicatorRight } from "@/lib/types";
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

  return (
    <>
      <PageHeader eyebrow="Account" title="บัญชีของฉัน" description={profile.email} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="ข้อมูลสมาชิก"
            action={profile.ib_verified
              ? <Badge tone="buy"><BadgeCheck className="size-3" /> ผ่านการตรวจ IB</Badge>
              : <Badge tone="brand"><Clock className="size-3" /> ยังไม่ผ่านการตรวจ IB</Badge>}
          />
          <ProfileForm profile={profile} />
        </Card>

        <div className="space-y-6">
          <Card id="telegram">
            <CardHeader title="Telegram" hint="ใช้รับลิงก์เข้าห้องสัญญาณตามสิทธิ์ของคุณ" />
            <div className="p-5">
              {link ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{link.tg_name || "Telegram"}</p>
                    <p className="text-xs text-muted">{link.tg_username ? `@${link.tg_username}` : `ID ${link.tg_uid}`}</p>
                  </div>
                  <Badge tone="buy">เชื่อมแล้ว</Badge>
                </div>
              ) : (
                <TelegramLinker pending={pending} />
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="ห้องสัญญาณ" hint="ลิงก์เข้าห้องใช้ได้ครั้งเดียว ภายใน 10 นาที" />
            {list.length ? (
              <ul className="divide-y divide-line">
                {list.map((r) => {
                  const active = !r.expires_at || new Date(r.expires_at) > new Date();
                  return (
                    <li key={r.code} className="flex items-center justify-between gap-4 px-5 py-3.5">
                      <div>
                        <p className="text-sm"><span className="num mr-2 text-accent">{r.code}</span>{r.indicators?.name}</p>
                        <p className="text-[11px] text-muted">{r.expires_at ? `${active ? "ใช้ได้ถึง" : "หมดอายุ"} ${fmtDate(r.expires_at)}` : "ตลอดชีพ"}</p>
                      </div>
                      {r.indicators?.telegram_room_id
                        ? <RoomButton code={r.code} disabled={!active || !link || !profile.ib_verified} />
                        : <span className="text-[11px] text-faint">ไม่มีห้อง</span>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty title="ยังไม่มีสิทธิ์อินดิเคเตอร์">กรอกชื่อผู้ใช้ TradingView และบัญชี Exness แล้วรอแอดมินให้สิทธิ์</Empty>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
