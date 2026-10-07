import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Badge, cx, Empty } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { IndicatorRight, Profile, SupportMessage, SupportRequest } from "@/lib/types";
import { ReplyForm } from "@/app/(app)/support/forms";
import { staffReply } from "../actions";
import { BackLink, InfoRow, Panel, TextLink } from "../../_components/admin-ui";
import { RequestControls } from "../controls";

export const metadata = { title: "คำขอจากสมาชิก" };

export default async function AdminSupportThread({ params }: PageProps<"/admin/support/[id]">) {
  const { id } = await params;
  const { supabase } = await requireStaff();
  const { data: req } = await supabase.from("support_requests").select("*").eq("id", id).maybeSingle<SupportRequest>();
  if (!req) notFound();
  const [{ data: msgs }, { data: member }, { data: rights }] = await Promise.all([
    supabase.from("support_messages").select("*").eq("request_id", id).order("created_at"),
    supabase.from("profiles").select("*").eq("id", req.user_id).maybeSingle<Profile>(),
    supabase.from("indicator_rights").select("*").eq("user_id", req.user_id).order("code"),
  ]);
  const thread = (msgs ?? []) as SupportMessage[];
  const st = SUPPORT_STATUS[req.status];
  const now = Date.now();

  const memberRights = (rights ?? []) as IndicatorRight[];

  return (
    <>
      <BackLink href="/admin/support">คำขอทั้งหมด</BackLink>
      <PageHeader
        eyebrow="คำขอจากสมาชิก"
        title={requestSubject(req.kind, req.indicator_code)}
        description={`ส่งเมื่อ ${fmtDateTime(req.created_at)}`}
        action={<RequestControls id={req.id} status={req.status} assigned={Boolean(req.assigned_to)} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="บทสนทนา" description={`${thread.length + 1} ข้อความ`} action={<Badge tone={st.tone}>{st.label}</Badge>}>
          <div className="p-4 sm:p-6">
            <ol className="space-y-4" aria-label="ข้อความในคำขอ">
              <Bubble staff={false} at={req.created_at} body={req.message} />
              {thread.map((m) => <Bubble key={m.id} staff={m.from_staff} at={m.created_at} body={m.body} />)}
            </ol>
          </div>
          <div className="border-t border-line bg-panel-2/40 p-4 sm:p-6">
            <ReplyForm requestId={req.id} action={staffReply} label="ตอบกลับสมาชิก" />
          </div>
        </Panel>

        <div className="min-w-0 space-y-6">
          <Panel title="สถานะคำขอ">
            <dl className="divide-y divide-line">
              <InfoRow k="สถานะ"><Badge tone={st.tone}>{st.label}</Badge></InfoRow>
              <InfoRow k="ผู้รับเรื่อง"><Badge tone={req.assigned_to ? "info" : "neutral"}>{req.assigned_to ? "มีผู้รับเรื่องแล้ว" : "ยังไม่มีผู้รับเรื่อง"}</Badge></InfoRow>
              <InfoRow k="ส่งเมื่อ">{fmtDateTime(req.created_at)}</InfoRow>
              <InfoRow k="อัปเดต">{fmtDateTime(req.updated_at)}</InfoRow>
            </dl>
          </Panel>

          <Panel title="ข้อมูลสมาชิก" action={member && <TextLink href={`/admin/members/${member.id}`}>เปิดโปรไฟล์ / จัดการสิทธิ์</TextLink>}>
            {member ? (
              <dl className="divide-y divide-line">
                {[
                  ["ชื่อ", member.display_name || "—"], ["อีเมล", member.email], ["TradingView", member.tradingview_username || "—"],
                  ["Exness", member.exness_account ? `${member.exness_account} · ${member.ib_verified ? "IB ผ่านแล้ว" : "รอตรวจ"}` : "—"],
                ].map(([k, v]) => (
                  <InfoRow key={k} k={k}><span className="num break-all">{v}</span></InfoRow>
                ))}
                <div className="px-4 py-3 sm:px-6">
                  <dt className="text-sm text-muted">สิทธิ์ปัจจุบัน</dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5 text-sm">
                    {memberRights.map((r) => {
                      const ok = !r.expires_at || new Date(r.expires_at).getTime() > now;
                      return <Badge key={r.code} tone={ok ? "buy" : "neutral"} className="num">{r.code} · {r.expires_at ? fmtDate(r.expires_at) : "ตลอดชีพ"}{!ok && " (หมดอายุ)"}</Badge>;
                    })}
                    {!memberRights.length && <span>ไม่มี</span>}
                  </dd>
                </div>
              </dl>
            ) : (
              <Empty title="ไม่พบข้อมูลสมาชิก" />
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function Bubble({ staff, at, body }: { staff: boolean; at: string; body: string }) {
  return (
    <li className={cx("flex", staff ? "justify-end" : "justify-start")}>
      <div className={cx("max-w-[85%] rounded-2xl px-4 py-3 shadow-xs", staff ? "rounded-br-md border border-brand/30 bg-brand-dim" : "rounded-bl-md border border-line bg-panel-2")}>
        <p className="text-xs font-semibold text-muted">{staff ? "ทีมงาน" : "สมาชิก"} · {fmtDateTime(at)}</p>
        <p className="mt-1 text-sm whitespace-pre-line">{body}</p>
      </div>
    </li>
  );
}
