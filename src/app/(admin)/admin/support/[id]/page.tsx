import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BackLink, EmptyLine, Section, TextLink } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { cx } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { IndicatorRight, Profile, SupportMessage, SupportRequest } from "@/lib/types";
import { ReplyForm } from "@/app/(app)/support/forms";
import { staffReply } from "../actions";
import { ToneStatus } from "../../_components/tone-status";
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
        title={requestSubject(req.kind, req.indicator_code)}
        description={`ส่งเมื่อ ${fmtDateTime(req.created_at)}`}
        action={<RequestControls id={req.id} status={req.status} assigned={Boolean(req.assigned_to)} />}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Section title="บทสนทนา" description={`${thread.length + 1} ข้อความ`} action={<ToneStatus tone={st.tone}>{st.label}</ToneStatus>}>
          <ol className="divide-y divide-line" aria-label="ข้อความในคำขอ">
            <Message staff={false} at={req.created_at} body={req.message} />
            {thread.map((m) => <Message key={m.id} staff={m.from_staff} at={m.created_at} body={m.body} />)}
          </ol>
          <div className="border-t border-line px-4 py-4 sm:px-5">
            <ReplyForm requestId={req.id} action={staffReply} label="ตอบกลับสมาชิก" />
          </div>
        </Section>

        <div className="min-w-0 space-y-10">
          <Section title="สถานะคำขอ">
            <dl className="divide-y divide-line">
              <Info k="สถานะ"><ToneStatus tone={st.tone}>{st.label}</ToneStatus></Info>
              <Info k="ผู้รับเรื่อง">{req.assigned_to ? "มีผู้รับเรื่องแล้ว" : "ยังไม่มีผู้รับเรื่อง"}</Info>
              <Info k="ส่งเมื่อ"><span className="num tabular-nums">{fmtDateTime(req.created_at)}</span></Info>
              <Info k="อัปเดต"><span className="num tabular-nums">{fmtDateTime(req.updated_at)}</span></Info>
            </dl>
          </Section>

          <Section title="ข้อมูลสมาชิก" action={member && <TextLink href={`/admin/members/${member.id}`}>เปิดโปรไฟล์ / จัดการสิทธิ์</TextLink>}>
            {member ? (
              <dl className="divide-y divide-line">
                {[
                  ["ชื่อ", member.display_name || "—"], ["อีเมล", member.email], ["TradingView", member.tradingview_username || "—"],
                  ["Exness", member.exness_account ? `${member.exness_account} · ${member.ib_verified ? "IB ผ่านแล้ว" : "รอตรวจ"}` : "—"],
                ].map(([k, v]) => (
                  <Info key={k} k={k}><span className="num break-all">{v}</span></Info>
                ))}
                <div className="px-4 py-3 sm:px-5">
                  <dt className="text-sm text-muted">สิทธิ์ปัจจุบัน</dt>
                  <dd className="mt-1 text-sm">
                    {memberRights.length ? (
                      <ul className="space-y-1">
                        {memberRights.map((r) => {
                          const ok = !r.expires_at || new Date(r.expires_at).getTime() > now;
                          return (
                            <li key={r.code} className="num flex items-center justify-between gap-3">
                              <span className="font-medium">{r.code}</span>
                              <span className={ok ? "text-fg" : "text-muted"}>{r.expires_at ? fmtDate(r.expires_at) : "ตลอดชีพ"}{!ok && " (หมดอายุ)"}</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : <span>ไม่มี</span>}
                  </dd>
                </div>
              </dl>
            ) : (
              <EmptyLine>ไม่พบข้อมูลสมาชิก</EmptyLine>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}

function Info({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 px-4 py-2.5 sm:px-5">
      <dt className="shrink-0 text-sm text-muted">{k}</dt>
      <dd className="min-w-0 text-right text-sm">{children}</dd>
    </div>
  );
}

function Message({ staff, at, body }: { staff: boolean; at: string; body: string }) {
  return (
    <li className={cx("px-4 py-4 sm:px-5", staff && "bg-panel-2")}>
      <p className="text-sm">
        <span className={cx("font-medium", staff && "text-accent")}>{staff ? "ทีมงาน" : "สมาชิก"}</span>
        <span className="num text-muted"> · {fmtDateTime(at)}</span>
      </p>
      <p className="mt-1 text-sm whitespace-pre-line">{body}</p>
    </li>
  );
}
