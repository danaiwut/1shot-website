import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Headset, User } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, cx, Notice } from "@/components/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CardContent, CardFooter } from "@/components/ui/card";
import { requireViewer } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { SupportMessage, SupportRequest } from "@/lib/types";
import { Section } from "../../_components/section";
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
      <Link href="/support" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-fg hover:underline"><ArrowLeft aria-hidden className="size-4" /> คำขอทั้งหมด</Link>
      <PageHeader title={requestSubject(req.kind, req.indicator_code)} description={`ส่งเมื่อ ${fmtDateTime(req.created_at)}`} action={<Badge tone={st.tone} className="px-3 py-1 text-sm">{st.label}</Badge>} />
      {sent && <div className="mx-auto mb-6 max-w-3xl"><Notice tone="success">ส่งคำขอเรียบร้อยแล้ว ทีมงานจะตอบกลับในหน้านี้</Notice></div>}

      <Section
        title="บทสนทนา"
        description={`${thread.length + 1} ข้อความ`}
        className="mx-auto max-w-3xl"
      >
        <CardContent className="px-4 py-6 sm:px-6">
          <ol className="space-y-4" aria-label="ข้อความในคำขอ">
            <Bubble mine at={req.created_at} body={req.message} />
            {thread.map((m) => <Bubble key={m.id} mine={!m.from_staff} at={m.created_at} body={m.body} />)}
          </ol>
        </CardContent>
        <CardFooter className="block border-t border-line bg-panel-2/40 px-4 py-5 sm:px-6">
          <p className="mb-3 text-sm text-muted">{st.hint}</p>
          <ReplyForm requestId={req.id} />
        </CardFooter>
      </Section>
    </>
  );
}

function Bubble({ mine, at, body }: { mine: boolean; at: string; body: string }) {
  return (
    <li className={cx("flex items-end gap-2.5", mine ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className={cx("text-xs font-semibold", mine ? "bg-brand text-white" : "border border-line bg-panel-3 text-fg")}>
          {mine ? <User aria-hidden className="size-4" /> : <Headset aria-hidden className="size-4" />}
        </AvatarFallback>
      </Avatar>
      <div className={cx("max-w-[85%] rounded-2xl px-4 py-3 shadow-xs", mine ? "rounded-br-md border border-brand/30 bg-brand-dim" : "rounded-bl-md border border-line bg-panel-2")}>
        <p className="text-xs font-semibold text-muted">{mine ? "คุณ" : "ทีมงาน 1SHOT"} · <time dateTime={at}>{fmtDateTime(at)}</time></p>
        <p className="mt-1 leading-relaxed whitespace-pre-line">{body}</p>
      </div>
    </li>
  );
}
