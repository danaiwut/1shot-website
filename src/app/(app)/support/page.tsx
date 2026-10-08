import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { SHADOW } from "@/components/app/form-kit";
import { Status } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink, cx } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { requestSubject, SUPPORT_STATUS } from "@/lib/support";
import type { SupportRequest } from "@/lib/types";
import { NewRequestForm } from "./forms";

export const metadata = { title: "คำขอและความช่วยเหลือ" };

const DOT = { brand: "warn", buy: "good", neutral: "neutral" } as const;

export default async function SupportPage({ searchParams }: PageProps<"/support">) {
  const sp = await searchParams;
  const { supabase, userId } = await requireViewer();
  const [{ data: requests }, { data: indicators }] = await Promise.all([
    supabase.from("support_requests").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(50),
    supabase.from("indicators").select("code, name").eq("is_reference", false).order("sort"),
  ]);
  const list = (requests ?? []) as SupportRequest[];
  const waiting = list.filter((r) => r.status === "open").length;
  const answered = list.filter((r) => r.status === "answered").length;

  return (
    <>
      <PageHeader
        eyebrow="ช่วยเหลือ"
        title="คำขอและความช่วยเหลือ"
        description="ขอสิทธิ์ ต่ออายุ แจ้งปัญหาห้องสมาชิก หรือสอบถามทีมงาน แล้วติดตามคำตอบได้ที่นี่"
        action={<ButtonLink href="/guide" variant="outline" className="rounded-full">คู่มือการใช้งาน</ButtonLink>}
      />

      <div className="grid items-start gap-8 2xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <section aria-labelledby="new-title" className="min-w-0">
          <h2 id="new-title" className="mb-4 text-xl font-black tracking-tight">ส่งคำขอใหม่<span className="text-brand">.</span></h2>
          <NewRequestForm
            indicators={(indicators ?? []) as { code: string; name: string }[]}
            defaultKind={typeof sp.kind === "string" ? sp.kind : undefined}
            defaultCode={typeof sp.code === "string" ? sp.code : undefined}
          />
        </section>

        <section aria-labelledby="mine-title" className="min-w-0 2xl:sticky 2xl:top-24">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 id="mine-title" className="text-xl font-black tracking-tight">คำขอของฉัน<span className="text-brand">.</span></h2>
            {list.length > 0 && (
              <p className="text-sm text-muted">
                {list.length} เรื่อง{answered > 0 && <> · <span className="font-semibold text-buy">ตอบแล้ว {answered}</span></>}{waiting > 0 && ` · รอตอบ ${waiting}`}
              </p>
            )}
          </div>
          {list.length ? (
            <ul className="space-y-3 2xl:max-h-[calc(100dvh-10rem)] 2xl:overflow-y-auto 2xl:p-1">
              {list.map((r) => {
                const st = SUPPORT_STATUS[r.status];
                return (
                  <li key={r.id}>
                    <Link
                      href={`/support/${r.id}`}
                      className={cx(
                        "group block rounded-2xl border bg-panel p-4 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand/50 focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:p-5",
                        r.status === "answered" ? "border-buy/40" : "border-line", SHADOW,
                      )}
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0 font-bold">{requestSubject(r.kind, r.indicator_code)}</span>
                        <Status tone={DOT[st.tone]}>{st.label}</Status>
                      </span>
                      <span className="mt-1.5 line-clamp-2 block text-sm text-muted">{r.message}</span>
                      <span className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                        <span>อัปเดต <span className="num">{fmtDateTime(r.updated_at)}</span></span>
                        <span className="inline-flex items-center gap-1 font-semibold text-accent">เปิดดู<ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={cx("flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-panel px-6 py-12 text-center")}>
              <span className="grid size-12 place-items-center rounded-full bg-brand-dim text-accent"><Inbox aria-hidden className="size-6" /></span>
              <p className="mt-4 font-bold">ยังไม่มีคำขอ</p>
              <p className="mt-1 text-sm text-muted">ส่งคำขอแรกได้จากฟอร์ม “ส่งคำขอใหม่” ทีมงานจะตอบกลับที่นี่</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
