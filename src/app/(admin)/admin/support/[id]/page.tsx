import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, CardHeader, cx } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { IndicatorRight, Profile, SupportMessage, SupportRequest } from "@/lib/types";
import { ReplyForm } from "@/app/(app)/support/forms";
import { staffReply } from "../actions";
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

  return (
    <>
      <Link href="/admin/support" className="mb-5 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-fg hover:underline"><ArrowLeft aria-hidden className="size-4" /> คำขอทั้งหมด</Link>
      <PageHeader eyebrow="คำขอจากสมาชิก" title={requestSubject(req.kind, req.indicator_code)} description={`ส่งเมื่อ ${fmtDateTime(req.created_at)}`}
        action={<div className="flex flex-wrap items-center gap-3"><Badge tone={st.tone} className="text-sm">{st.label}</Badge><RequestControls id={req.id} status={req.status} assigned={Boolean(req.assigned_to)} /></div>} />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-5 sm:p-6">
          <ol className="space-y-4" aria-label="ข้อความในคำขอ">
            <Bubble staff={false} at={req.created_at} body={req.message} />
            {thread.map((m) => <Bubble key={m.id} staff={m.from_staff} at={m.created_at} body={m.body} />)}
          </ol>
          <div className="mt-6 border-t border-line pt-6">
            <ReplyForm requestId={req.id} action={staffReply} label="ตอบกลับสมาชิก" />
          </div>
        </Card>

        <Card className="self-start">
          <CardHeader title="ข้อมูลสมาชิก" action={member && <Link href={`/admin/members/${member.id}`} className="inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4">เปิดโปรไฟล์ / จัดการสิทธิ์</Link>} />
          {member && (
            <dl className="divide-y divide-line text-sm">
              {[
                ["ชื่อ", member.display_name || "—"], ["อีเมล", member.email], ["TradingView", member.tradingview_username || "—"],
                ["Exness", member.exness_account ? `${member.exness_account} · ${member.ib_verified ? "IB ผ่านแล้ว" : "รอตรวจ"}` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-5 py-3"><dt className="text-muted">{k}</dt><dd className="num text-right">{v}</dd></div>
              ))}
              <div className="px-5 py-3">
                <dt className="text-muted">สิทธิ์ปัจจุบัน</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {((rights ?? []) as IndicatorRight[]).map((r) => {
                    const ok = !r.expires_at || new Date(r.expires_at).getTime() > now;
                    return <Badge key={r.code} tone={ok ? "buy" : "neutral"} className="num">{r.code} · {r.expires_at ? fmtDate(r.expires_at) : "ตลอดชีพ"}</Badge>;
                  })}
                  {!rights?.length && <span>ไม่มี</span>}
                </dd>
              </div>
            </dl>
          )}
        </Card>
      </div>
    </>
  );
}

function Bubble({ staff, at, body }: { staff: boolean; at: string; body: string }) {
  return (
    <li className={cx("flex", staff ? "justify-end" : "justify-start")}>
      <div className={cx("max-w-[85%] rounded-2xl px-4 py-3", staff ? "bg-brand-dim" : "border border-line bg-panel-2")}>
        <p className="text-xs font-semibold text-muted">{staff ? "ทีมงาน" : "สมาชิก"} · {fmtDateTime(at)}</p>
        <p className="mt-1 whitespace-pre-line">{body}</p>
      </div>
    </li>
  );
}
