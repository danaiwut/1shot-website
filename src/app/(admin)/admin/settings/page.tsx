import Link from "next/link";
import { Section, StatRow, Status } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { Notice, TextLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { getTvSession, maskSecret } from "@/lib/tv-session";
import { ScriptsForm, SessionForm } from "./forms";

export const metadata = { title: "ตั้งค่า TradingView" };

type Sync = { expires_at: string | null; tv_synced_at: string | null; tv_synced_expires: string | null };
const needsTv = (r: Sync) => !r.tv_synced_at || (r.tv_synced_expires ?? null) !== (r.expires_at ?? null);

export default async function TvSettingsPage() {
  const { supabase } = await requireStaff();
  const nowIso = new Date().toISOString();
  const live = `expires_at.is.null,expires_at.gt.${nowIso}`;
  const [session, { data: indicators }, { data: rights }, { data: grants }] = await Promise.all([
    getTvSession(),
    supabase.from("indicators").select("code, name, tv_script_id, is_reference, sort").order("sort"),
    supabase.from("indicator_rights").select("expires_at, tv_synced_at, tv_synced_expires").or(live).limit(1000),
    supabase.from("tradingview_grants").select("expires_at, tv_synced_at, tv_synced_expires").or(live).limit(1000),
  ]);
  const sellable = ((indicators ?? []) as { code: string; name: string; tv_script_id: string | null; is_reference: boolean }[])
    .filter((i) => !i.is_reference);
  const withScript = sellable.filter((i) => i.tv_script_id);
  const pending =
    ((rights ?? []) as Sync[]).filter(needsTv).length + ((grants ?? []) as Sync[]).filter(needsTv).length;
  const auto = Boolean(session.id);

  return (
    <>
      <PageHeader
        title="ตั้งค่า TradingView"
        description="ใส่ Session ของบัญชีเจ้าของสคริปต์เพื่อให้สิทธิ์อัตโนมัติหลังลูกค้าซื้อ และผูก Script ID (PUB;…) ของอินดิเคเตอร์แต่ละตัว"
      />
      <div className="space-y-10">
        <StatRow
          items={[
            {
              label: "ให้สิทธิ์อัตโนมัติ",
              value: auto ? "เปิดอยู่" : "ปิดอยู่",
              hint: auto
                ? <Status tone="good">ใช้ค่าจาก{session.source === "db" ? "จากหลังบ้าน" : "จาก env เซิร์ฟเวอร์"}{session.updatedAt ? ` · บันทึก ${fmtDateTime(session.updatedAt)}` : ""}</Status>
                : <Status tone="warn">ต้องเปิดมือที่หน้าให้สิทธิ์</Status>,
            },
            {
              label: "สคริปต์ที่ผูกแล้ว",
              value: `${withScript.length} / ${sellable.length}`,
              hint: withScript.length < sellable.length ? <Status tone="warn">ยังไม่ครบ</Status> : "ครบแล้ว",
            },
            {
              label: "คิวรอเปิดใน TradingView",
              value: String(pending),
              hint: pending ? <TextLink href="/admin/rights#tv">ไปเปิดสิทธิ์</TextLink> : "ไม่มีค้าง",
            },
          ]}
        />

        <Section
          title="Session เจ้าของสคริปต์"
          description="เปิด TradingView ด้วยบัญชีเจ้าของสคริปต์ → DevTools (F12) → Application → Cookies → tradingview.com → คัดลอกค่า sessionid (และ sessionid_sign ถ้ามี) มาวาง ค่านี้เหมือนรหัสผ่าน ห้ามส่งให้ใคร"
        >
          <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <p>ค่าปัจจุบัน: <span className="num font-bold">{auto ? maskSecret(session.id) : "ยังไม่ได้ตั้ง"}</span></p>
            {session.source === "env" && (
              <Notice tone="info">ตอนนี้ใช้ค่าจาก env บนเซิร์ฟเวอร์ วางค่าที่นี่เพื่อทับด้วยค่าจากหลังบ้าน (มีผลทันที ไม่ต้อง deploy)</Notice>
            )}
          </div>
          <SessionForm />
          <p className="mt-4 text-sm text-muted">
            ถ้าออกจากระบบ TradingView ในเบราว์เซอร์ ค่านี้จะใช้ไม่ได้ ให้กลับมาวางค่าใหม่ที่นี่
            ดูได้จากสถานะด้านบนและคิว “ต้องเปิดใน TradingView” ที่<Link href="/admin/rights#tv" className="font-medium text-accent underline-offset-4 hover:underline"> หน้าให้สิทธิ์</Link>
          </p>
        </Section>

        <Section
          title="Script ID รายอินดิเคเตอร์"
          description="เปิดสคริปต์บน TradingView → Manage access → คัดลอก Pine ID (ขึ้นต้นด้วย PUB;) ของแต่ละตัวมากรอก ระบบใช้ค่านี้ตอนเปิดสิทธิ์ให้ลูกค้า"
        >
          {sellable.length ? (
            <ScriptsForm rows={sellable.map((i) => ({ code: i.code, name: i.name, scriptId: i.tv_script_id }))} />
          ) : (
            <p className="text-sm text-muted">ยังไม่มีอินดิเคเตอร์ที่ขาย</p>
          )}
        </Section>
      </div>
    </>
  );
}

