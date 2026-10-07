import { EmptyLine, Row, Rows, SettingsSection, Status, TextLink } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { requireViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { lotsByAccount, monthStart } from "@/lib/lots";
import type { IndicatorRight } from "@/lib/types";
import { changePassword } from "../../(auth)/actions";
import { PasswordForm } from "../../(auth)/auth-form";
import { ProfileForm, RoomButton, TelegramLinker } from "./forms";

export const metadata = { title: "บัญชีของฉัน" };

export default async function AccountPage() {
  const { profile, supabase, userId } = await requireViewer();
  const [{ data: link }, { data: token }, { data: rights }] = await Promise.all([
    supabase.from("telegram_links").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("telegram_link_tokens").select("tg_uid, tg_name, tg_username, expires_at").eq("user_id", userId).maybeSingle(),
    supabase.from("indicator_rights").select("*, indicators(name, telegram_room_id)").eq("user_id", userId).order("code"),
  ]);
  const account = profile.exness_account;
  const [lotsNow, lotsPrev] = account
    ? await Promise.all([lotsByAccount(supabase, monthStart(0), monthStart(1), [account]), lotsByAccount(supabase, monthStart(-1), monthStart(0), [account])])
    : [null, null];
  const pending = token?.tg_uid && new Date(token.expires_at) > new Date() ? { name: token.tg_name, username: token.tg_username } : null;
  const list = (rights ?? []) as (IndicatorRight & { indicators: { name: string; telegram_room_id: string | null } | null })[];

  const ib = profile.ib_verified
    ? <Status tone="good">ผ่านการตรวจ IB</Status>
    : profile.exness_account ? <Status tone="warn">IB รอตรวจ</Status> : undefined;

  return (
    <>
      <PageHeader title="บัญชีของฉัน" description={profile.email} action={ib} />

      <div className="max-w-4xl">
        <SettingsSection title="ข้อมูลสมาชิก" description="ชื่อ TradingView ใช้เปิดสิทธิ์อินดิเคเตอร์ให้คุณ">
          <ProfileForm profile={profile} />
        </SettingsSection>

        <SettingsSection
          id="telegram"
          title="Telegram"
          description={<>ใช้รับลิงก์เข้าห้องสัญญาณตามสิทธิ์ของคุณ<span className="mt-2 block"><Status tone={link ? "good" : "neutral"}>{link ? "เชื่อมแล้ว" : "ยังไม่เชื่อม"}</Status></span></>}
        >
          {link ? (
            <div className="rounded-lg border border-line bg-panel px-4 py-3">
              <p className="truncate text-sm font-medium">{link.tg_name || "Telegram"}</p>
              <p className="num truncate text-sm text-muted">{link.tg_username ? `@${link.tg_username}` : `ID ${link.tg_uid}`}</p>
            </div>
          ) : (
            <TelegramLinker pending={pending} />
          )}
        </SettingsSection>

        <SettingsSection title="ห้องสัญญาณ" description="ลิงก์เข้าห้องใช้ได้ครั้งเดียว ภายใน 10 นาที">
          {!link && list.length > 0 && <p className="text-sm text-muted">เชื่อม Telegram ด้านบนก่อน จึงจะขอลิงก์เข้าห้องได้</p>}
          <div className="overflow-hidden rounded-lg border border-line bg-panel">
            {list.length ? (
              <Rows>
                {list.map((r) => {
                  const active = !r.expires_at || new Date(r.expires_at) > new Date();
                  return (
                    <Row key={r.code} className="flex-wrap justify-between gap-y-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="num w-10 shrink-0 text-sm font-semibold text-accent">{r.code}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{r.indicators?.name ?? r.code}</p>
                          <p className="text-sm text-muted">
                            <Status tone={active ? "good" : "neutral"}>{active ? "ใช้งานได้" : "หมดอายุ"}</Status>
                            <span> · {r.expires_at ? `${active ? "ถึง" : "เมื่อ"} ${fmtDate(r.expires_at)}` : "ตลอดชีพ"}</span>
                          </p>
                        </div>
                      </div>
                      {r.indicators?.telegram_room_id
                        ? <RoomButton code={r.code} disabled={!active || !link} />
                        : <span className="text-sm text-muted">ไม่มีห้อง</span>}
                    </Row>
                  );
                })}
              </Rows>
            ) : (
              <EmptyLine action={<TextLink href="/store">ไปที่ร้านค้า</TextLink>}>ยังไม่มีสิทธิ์อินดิเคเตอร์ ซื้อแพ็กเกจ หรือกรอกบัญชี Exness แล้วรอแอดมินให้สิทธิ์</EmptyLine>
            )}
          </div>
        </SettingsSection>

        {account && (
          <SettingsSection title="Lot ที่เทรด (Exness)" description={`บัญชี ${account} · อัปเดตจาก Exness วันละครั้ง`}>
            <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-panel">
              <div className="px-4 py-3.5"><dt className="text-sm text-muted">เดือนนี้</dt><dd className="num mt-1 text-xl font-semibold tabular-nums">{(lotsNow?.get(account)?.lots ?? 0).toFixed(2)}</dd></div>
              <div className="border-l border-line px-4 py-3.5"><dt className="text-sm text-muted">เดือนที่แล้ว</dt><dd className="num mt-1 text-xl font-semibold tabular-nums">{(lotsPrev?.get(account)?.lots ?? 0).toFixed(2)}</dd></div>
            </dl>
          </SettingsSection>
        )}

        <SettingsSection id="password" title="รหัสผ่าน" description="ลืมรหัสผ่านปัจจุบัน? ออกจากระบบแล้วใช้ “ลืมรหัสผ่าน” ที่หน้าเข้าสู่ระบบ">
          <PasswordForm action={changePassword} email={profile.email} withCurrent submit="เปลี่ยนรหัสผ่าน" />
        </SettingsSection>
      </div>
    </>
  );
}
