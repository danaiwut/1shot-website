import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, cx, Notice } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { SupportMessage, SupportRequest } from "@/lib/types";
import { ReplyForm } from "../forms";

export const metadata = { title: "รายละเอียดคำขอ" };

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
    <>
      <Link href="/support" className="mb-5 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-fg hover:underline"><ArrowLeft aria-hidden className="size-4" /> คำขอทั้งหมด</Link>
      <PageHeader title={requestSubject(req.kind, req.indicator_code)} description={`ส่งเมื่อ ${fmtDateTime(req.created_at)}`} action={<Badge tone={st.tone} className="text-sm">{st.label}</Badge>} />
      {sent && <div className="mb-6"><Notice tone="success">ส่งคำขอเรียบร้อยแล้ว ทีมงานจะตอบกลับในหน้านี้</Notice></div>}

      <Card className="mx-auto max-w-3xl p-5 sm:p-6">
        <ol className="space-y-4" aria-label="ข้อความในคำขอ">
          <Bubble mine at={req.created_at} body={req.message} />
          {thread.map((m) => <Bubble key={m.id} mine={!m.from_staff} at={m.created_at} body={m.body} />)}
        </ol>
        <div className="mt-6 border-t border-line pt-6">
          <p className="mb-3 text-sm text-muted">{st.hint}</p>
          <ReplyForm requestId={req.id} />
        </div>
      </Card>
    </>
  );
}

function Bubble({ mine, at, body }: { mine: boolean; at: string; body: string }) {
  return (
    <li className={cx("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cx("max-w-[85%] rounded-2xl px-4 py-3", mine ? "bg-brand-dim" : "border border-line bg-panel-2")}>
        <p className="text-xs font-semibold text-muted">{mine ? "คุณ" : "ทีมงาน 1SHOT"} · {fmtDateTime(at)}</p>
        <p className="mt-1 whitespace-pre-line">{body}</p>
      </div>
    </li>
  );
}
