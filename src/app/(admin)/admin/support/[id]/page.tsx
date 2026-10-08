import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { FormLayout, Panel, SHADOW } from "@/components/app/form-kit";
import { BackLink, Status } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink, cx } from "@/components/ui";
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
  const who = member?.display_name || member?.email?.split("@")[0] || "สมาชิก";
  const controls = <RequestControls id={req.id} status={req.status} assigned={Boolean(req.assigned_to)} />;

  return (
    <>
      <BackLink href="/admin/support">คำขอทั้งหมด</BackLink>
      <PageHeader
        title={requestSubject(req.kind, req.indicator_code)}
        description={<>{who} · ส่งเมื่อ <span className="num">{fmtDateTime(req.created_at)}</span></>}
        action={<><ToneStatus tone={st.tone}>{st.label}</ToneStatus><div className="xl:hidden">{controls}</div></>}
      />

      <FormLayout
        aside={
          <>
            <Panel title="สถานะคำขอ">
              <dl className="mb-4 divide-y divide-line">
                <Info k="สถานะ"><ToneStatus tone={st.tone}>{st.label}</ToneStatus></Info>
                <Info k="ผู้รับเรื่อง">{req.assigned_to ? "มีผู้รับเรื่องแล้ว" : <span className="font-semibold text-accent">ยังไม่มี</span>}</Info>
                <Info k="ส่งเมื่อ"><span className="num tabular-nums">{fmtDateTime(req.created_at)}</span></Info>
                <Info k="อัปเดต"><span className="num tabular-nums">{fmtDateTime(req.updated_at)}</span></Info>
              </dl>
              <div className="hidden xl:block"><RequestControls id={req.id} status={req.status} assigned={Boolean(req.assigned_to)} stack /></div>
            </Panel>

            <Panel title="ข้อมูลสมาชิก">
              {member ? (
                <>
                  <p className="text-lg font-bold">{who}</p>
                  <p className="text-sm break-all text-muted">{member.email}</p>
                  <dl className="mt-3 divide-y divide-line border-t border-line">
                    <Info k="TradingView"><span className="num break-all">{member.tradingview_username || "—"}</span></Info>
                    <Info k="Exness">
                      {member.exness_account
                        ? <span className="flex flex-wrap items-center justify-end gap-2"><span className="num">{member.exness_account}</span><Status tone={member.ib_verified ? "good" : "warn"}>{member.ib_verified ? "IB ผ่าน" : "รอตรวจ"}</Status></span>
                        : "—"}
                    </Info>
                  </dl>
                  <p className="mt-4 mb-2 text-sm font-semibold">สิทธิ์ปัจจุบัน</p>
                  {memberRights.length ? (
                    <ul className="space-y-1.5">
                      {memberRights.map((r) => {
                        const ok = !r.expires_at || new Date(r.expires_at).getTime() > now;
                        return (
                          <li key={r.code} className="num flex items-center justify-between gap-3 rounded-lg bg-panel-2 px-3 py-2 text-sm">
                            <span className="font-bold">{r.code}</span>
                            <span className={ok ? "text-fg" : "text-muted"}>{r.expires_at ? fmtDate(r.expires_at) : "ตลอดชีพ"}{!ok && " (หมดอายุ)"}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : <p className="rounded-lg bg-panel-2 px-3 py-2 text-sm text-muted">ยังไม่มีสิทธิ์</p>}
                  <ButtonLink href={`/admin/members/${member.id}`} variant="outline" className="mt-4 h-11 w-full rounded-full font-semibold">
                    เปิดโปรไฟล์ / จัดการสิทธิ์ <ArrowRight aria-hidden />
                  </ButtonLink>
                </>
              ) : (
                <p className="text-sm text-muted">ไม่พบข้อมูลสมาชิก</p>
              )}
            </Panel>
          </>
        }
      >
        <section aria-labelledby="thread-title" className={cx("rounded-2xl border border-line bg-panel", SHADOW)}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <h2 id="thread-title" className="text-lg font-bold tracking-tight">บทสนทนา</h2>
            <span className="text-sm text-muted tabular-nums">{thread.length + 1} ข้อความ</span>
          </div>
          <ol className="space-y-5 px-4 py-6 sm:px-6" aria-label="ข้อความในคำขอ">
            <Bubble staff={false} name={who} at={req.created_at} body={req.message} />
            {thread.map((m) => <Bubble key={m.id} staff={m.from_staff} name={who} at={m.created_at} body={m.body} />)}
          </ol>
          <div className="sticky bottom-0 z-10 rounded-b-2xl border-t border-line bg-panel/95 px-4 py-4 backdrop-blur sm:px-6">
            <ReplyForm requestId={req.id} action={staffReply} label="ตอบกลับสมาชิก" />
          </div>
        </section>
      </FormLayout>
    </>
  );
}

function Info({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-4 py-2">
      <dt className="shrink-0 text-sm text-muted">{k}</dt>
      <dd className="min-w-0 text-right text-sm">{children}</dd>
    </div>
  );
}

/** Customer on the left, staff on the right in brand-dim. */
function Bubble({ staff, name, at, body }: { staff: boolean; name: string; at: string; body: string }) {
  return (
    <li className={cx("flex flex-col", staff ? "items-end" : "items-start")}>
      <p className={cx("mb-1 flex items-center gap-2 px-1 text-xs", staff && "flex-row-reverse")}>
        <span aria-hidden className={cx("grid size-6 place-items-center rounded-full text-[0.7rem] font-bold", staff ? "bg-brand text-white" : "bg-panel-3 text-muted")}>
          {staff ? "1S" : name.slice(0, 1).toUpperCase()}
        </span>
        <span className={cx("font-semibold", staff && "text-accent")}>{staff ? "ทีมงาน" : name}</span>
        <time dateTime={at} className="num text-muted">{fmtDateTime(at)}</time>
      </p>
      <div className={cx(
        "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line break-words sm:max-w-[75%]",
        staff ? "rounded-tr-md border border-brand/20 bg-brand-dim" : "rounded-tl-md bg-panel-2",
      )}>
        {body}
      </div>
    </li>
  );
}
