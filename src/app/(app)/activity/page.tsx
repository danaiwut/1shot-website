import Link from "next/link";
import { BadgeCheck, History, KeyRound, MessageCircle, Send, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CARD } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/toolbar";
import { cx } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { describeAudit } from "@/lib/support";
import type { AuditEntry } from "@/lib/types";
import { track } from "@/components/brand";

export const metadata = { title: "ประวัติของฉัน" };

const ICON: Record<string, LucideIcon> = { right: KeyRound, role: ShieldCheck, ib: BadgeCheck, telegram: Send, support: MessageCircle };
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" });
const time = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });

export default async function ActivityPage() {
  const { supabase, userId } = await requireViewer();
  const { data } = await supabase.from("audit_log").select("*").eq("subject_id", userId).order("created_at", { ascending: false }).limit(100);
  const list = (data ?? []) as AuditEntry[];
  const actor = (e: AuditEntry) => (e.actor_id === null ? "โดยระบบ (การชำระเงิน)" : e.actor_id === userId ? "โดยคุณ" : "โดยทีมงาน");
  const days = Map.groupBy(list, (e) => dayKey.format(new Date(e.created_at)));

  return (
    <>
      <PageHeader
        eyebrow="Activity"
        title="ประวัติของฉัน"
        description="บันทึกทุกครั้งที่สิทธิ์ สถานะ IB หรือบัญชีของคุณเปลี่ยน ทั้งจากการซื้อและจากทีมงาน"
      />
      {list.length ? (
        <div className="space-y-8">
          <p className="text-sm text-muted">{list.length} รายการล่าสุด เรียงจากใหม่ไปเก่า</p>
          {[...days].map(([day, items]) => (
            <section key={day} aria-label={fmtDate(items[0].created_at)}>
              <h2 className={cx("mb-3 text-xs font-bold text-muted", track(fmtDate(items[0].created_at), "tracking-[0.14em]"))}>{fmtDate(items[0].created_at)}</h2>
              <ol className={cx(CARD, "divide-y divide-line")}>
                {items.map((e) => {
                  const d = describeAudit(e);
                  const Icon = ICON[e.action.split(".")[0]] ?? History;
                  const team = e.actor_id !== null && e.actor_id !== userId;
                  return (
                    <li key={e.id} className="flex items-start gap-4 px-4 py-4 sm:px-6">
                      <span aria-hidden className={cx("grid size-10 shrink-0 place-items-center rounded-xl", e.action === "right.revoke" ? "bg-panel-3 text-muted" : "bg-brand text-white")}>
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <p className="font-semibold">{d.title}</p>
                          <time dateTime={e.created_at} className="num shrink-0 text-sm text-muted tabular-nums">{time.format(new Date(e.created_at))}</time>
                        </div>
                        {d.detail && <p className="mt-0.5 text-sm break-words text-muted">{d.detail}</p>}
                        <span className={cx("mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", team ? "bg-brand-dim text-accent" : "bg-panel-3 text-muted")}>{actor(e)}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <div className={CARD}>
          <EmptyState
            icon={<History />}
            title="ยังไม่มีประวัติ"
            action={<Link href="/store" className="inline-flex h-11 items-center rounded-full bg-fg px-5 text-sm font-semibold text-ink transition-colors hover:bg-brand hover:text-white">ไปที่ร้านค้า</Link>}
          >
            เมื่อสิทธิ์หรือข้อมูลบัญชีของคุณเปลี่ยน จะบันทึกไว้ที่นี่
          </EmptyState>
        </div>
      )}
    </>
  );
}
