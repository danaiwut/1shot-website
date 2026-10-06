import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, Empty, Notice } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "อีเมลที่ส่ง" };

type Row = {
  id: number; user_id: string | null; order_id: string | null; kind: "purchase" | "renewal" | "refund";
  to_email: string; subject: string; html: string; status: "sent" | "failed" | "logged"; error: string | null; created_at: string;
};
const KIND = { purchase: "ซื้อสำเร็จ", renewal: "ต่ออายุ", refund: "คืนเงิน" } as const;
const STATUS = {
  sent: { label: "ส่งแล้ว", tone: "buy" },
  failed: { label: "ส่งไม่สำเร็จ", tone: "sell" },
  logged: { label: "บันทึกไว้ (ไม่ได้ส่ง)", tone: "neutral" },
} as const;

export default async function EmailsPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("email_log").select("*").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as Row[];
  const configured = Boolean(serverEnv.resendApiKey() && serverEnv.emailFrom());

  return (
    <>
      <PageHeader eyebrow="ผู้ดูแลระบบ" title="อีเมลที่ส่ง" description="อีเมลแจ้งลูกค้าเมื่อซื้อสำเร็จ ต่ออายุ และคืนเงิน 100 รายการล่าสุด" />
      {!configured && (
        <div className="mb-6">
          <Notice>
            ยังไม่ได้ตั้ง RESEND_API_KEY และ EMAIL_FROM อีเมลจึงถูกบันทึกไว้แต่ยังไม่ได้ส่ง
          </Notice>
        </div>
      )}
      <Card className="overflow-hidden">
        {rows.length ? (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="px-4 py-3.5 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.subject}</p>
                    <p className="truncate text-xs text-muted">
                      {r.user_id ? <Link href={`/admin/members/${r.user_id}`} className="hover:text-accent">{r.to_email}</Link> : r.to_email}
                      {" · "}{fmtDateTime(r.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge>{KIND[r.kind]}</Badge>
                    <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                  </div>
                </div>
                {r.error && <p className="mt-1 text-xs text-sell">{r.error}</p>}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted">ดูตัวอย่างอีเมล</summary>
                  <iframe title={`ตัวอย่างอีเมล: ${r.subject}`} srcDoc={r.html} sandbox="" className="mt-2 h-[560px] w-full rounded-xl border border-line bg-white" />
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="ยังไม่มีอีเมล">อีเมลจะถูกส่งเมื่อมีการซื้อสำเร็จหรือคืนเงิน</Empty>
        )}
      </Card>
    </>
  );
}
