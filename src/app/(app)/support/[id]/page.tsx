import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { BookOpen, Plus, User } from "lucide-react";
import { FormLayout, Panel, SHADOW } from "@/components/app/form-kit";
import { BackLink, Status } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink, cx, Notice } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_KIND, SUPPORT_STATUS } from "@/lib/support";
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
    <>
      <BackLink href="/support">คำขอทั้งหมด</BackLink>
      <PageHeader
        eyebrow="คำขอของฉัน"
        title={requestSubject(req.kind, req.indicator_code)}
        description={<>ส่งเมื่อ <span className="num">{fmtDateTime(req.created_at)}</span></>}
        action={<Status tone={DOT[st.tone]}>{st.label}</Status>}
      />

      {sent && <div className="mb-6"><Notice tone="success">ส่งคำขอเรียบร้อยแล้ว ทีมงานจะตอบกลับในหน้านี้</Notice></div>}

      <FormLayout
        aside={
          <>
            <Panel title="ข้อมูลคำขอ">
              <dl className="divide-y divide-line">
                <Info k="สถานะ"><Status tone={DOT[st.tone]}>{st.label}</Status></Info>
                <Info k="หัวข้อ">{SUPPORT_KIND[req.kind]}</Info>
                <Info k="อินดิเคเตอร์"><span className="num font-semibold">{req.indicator_code ?? "—"}</span></Info>
                <Info k="ส่งเมื่อ"><span className="num tabular-nums">{fmtDateTime(req.created_at)}</span></Info>
                <Info k="อัปเดต"><span className="num tabular-nums">{fmtDateTime(req.updated_at)}</span></Info>
              </dl>
              <p className="mt-3 rounded-xl bg-panel-2 px-3 py-2.5 text-sm text-muted">{st.hint}</p>
            </Panel>
            <Panel title="ทางลัด">
              <div className="grid gap-2">
                <ButtonLink href="/support" variant="outline" className="h-11 rounded-full font-semibold"><Plus aria-hidden />ส่งคำขอใหม่</ButtonLink>
                <ButtonLink href="/guide" variant="ghost" className="h-11 rounded-full font-semibold"><BookOpen aria-hidden />คู่มือการใช้งาน</ButtonLink>
              </div>
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
            <Bubble mine at={req.created_at} body={req.message} />
            {thread.map((m) => <Bubble key={m.id} mine={!m.from_staff} at={m.created_at} body={m.body} />)}
          </ol>
          <div className="sticky bottom-0 z-10 rounded-b-2xl border-t border-line bg-panel/95 px-4 py-4 backdrop-blur sm:px-6">
            <ReplyForm requestId={req.id} />
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

/** Me on the right in brand-dim, staff on the left. */
function Bubble({ mine, at, body }: { mine: boolean; at: string; body: string }) {
  return (
    <li className={cx("flex flex-col", mine ? "items-end" : "items-start")}>
      <p className={cx("mb-1 flex items-center gap-2 px-1 text-xs", mine && "flex-row-reverse")}>
        <span aria-hidden className={cx("grid size-6 place-items-center rounded-full text-[0.7rem] font-bold", mine ? "bg-panel-3 text-muted" : "bg-brand text-white")}>
          {mine ? <User className="size-3.5" /> : "1S"}
        </span>
        <span className={cx("font-semibold", !mine && "text-accent")}>{mine ? "คุณ" : "ทีมงาน 1SHOT"}</span>
        <time dateTime={at} className="num text-muted">{fmtDateTime(at)}</time>
      </p>
      <div className={cx(
        "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-line sm:max-w-[75%]",
        mine ? "rounded-tr-md border border-brand/20 bg-brand-dim" : "rounded-tl-md bg-panel-2",
      )}>
        {body}
      </div>
    </li>
  );
}
