import { notFound } from "next/navigation";
import { BackLink, Section, Status } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { cx, Notice } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { SupportMessage, SupportRequest } from "@/lib/types";
import { ReplyForm } from "../forms";

export const metadata = { title: "รายละเอียดคำขอ" };

const DOT = { brand: "warn", buy: "good", neutral: "neutral" } as const;

export default async function SupportThreadPage({ params, searchParams }: PageProps<"/support/[id]">) {
  const { id } = await params;
  const { sent } = await searchParams;
  const { supabase, userId } = await requireViewer();
  const { data: req } = await supabase.from("support_requests").select("*").eq("id", id).eq("user_id", userId).maybeSingle<SupportRequest>();
  if (!req) notFound();
  const { data: msgs } = await supabase.from("support_messages").select("*").eq("request_id", id).order("created_at");
  const thread = (msgs ?? []) as SupportMessage[];
  const st = SUPPORT_STATUS[req.status];

  return (
    <div className="max-w-3xl">
      <BackLink href="/support">คำขอทั้งหมด</BackLink>
      <PageHeader
        title={requestSubject(req.kind, req.indicator_code)}
        description={<>ส่งเมื่อ <span className="num">{fmtDateTime(req.created_at)}</span></>}
        action={<Status tone={DOT[st.tone]}>{st.label}</Status>}
      />

      <div className="space-y-6">
        {sent && <Notice tone="success">ส่งคำขอเรียบร้อยแล้ว ทีมงานจะตอบกลับในหน้านี้</Notice>}

        <Section title="บทสนทนา" description={`${thread.length + 1} ข้อความ · ${st.hint}`}>
          <ol className="divide-y divide-line" aria-label="ข้อความในคำขอ">
            <Message mine at={req.created_at} body={req.message} />
            {thread.map((m) => <Message key={m.id} mine={!m.from_staff} at={m.created_at} body={m.body} />)}
          </ol>
          <div className="border-t border-line px-4 py-5 sm:px-5">
            <ReplyForm requestId={req.id} />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Message({ mine, at, body }: { mine: boolean; at: string; body: string }) {
  return (
    <li className={cx("px-4 py-4 sm:px-5", !mine && "bg-panel-2")}>
      <p className="text-sm">
        <span className="font-semibold">{mine ? "คุณ" : "ทีมงาน 1SHOT"}</span>
        <span className="text-muted"> · <time dateTime={at} className="num">{fmtDateTime(at)}</time></span>
      </p>
      <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{body}</p>
    </li>
  );
}
