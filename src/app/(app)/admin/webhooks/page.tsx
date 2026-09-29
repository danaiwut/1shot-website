import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, CardHeader, Empty } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { publicEnv, serverEnv } from "@/lib/env";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "Webhook log" };

type Receipt = { id: number; received_at: string; ok: boolean; inserted: number; error: string | null; excerpt: string | null };

export default async function WebhooksPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("webhook_receipts").select("*").order("received_at", { ascending: false }).limit(100);
  const secret = serverEnv.webhookSecret();
  const masked = secret ? `${secret.slice(0, 4)}••••${secret.slice(-2)}` : "(ยังไม่ได้ตั้ง TRADINGVIEW_WEBHOOK_SECRET)";

  return (
    <>
      <PageHeader eyebrow="Admin" title="Webhook log" description="Alert จาก TradingView 100 รายการล่าสุด" />
      <Card className="mb-6 p-5">
        <p className="text-xs text-muted">URL สำหรับตั้งใน TradingView Alert → Webhook URL</p>
        <code className="num mt-2 block overflow-x-auto rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-xs whitespace-nowrap">{publicEnv.siteUrl()}/api/webhook/tradingview/{masked}</code>
        <p className="mt-2 text-xs text-faint">ใช้ค่า secret จริงจากตัวแปรสภาพแวดล้อม เก็บ URL นี้เป็นความลับ ใครได้ไปก็ส่งสัญญาณปลอมเข้าระบบได้</p>
      </Card>
      <Card>
        <CardHeader title="รายการล่าสุด" />
        {data?.length ? (
          <ul className="divide-y divide-line">
            {(data as Receipt[]).map((r) => (
              <li key={r.id} className="px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge tone={r.ok ? (r.inserted ? "buy" : "neutral") : "sell"}>{r.ok ? (r.inserted ? `บันทึก ${r.inserted}` : "ซ้ำ") : "ปฏิเสธ"}</Badge>
                    {r.error && <span className="text-xs text-sell">{r.error}</span>}
                  </span>
                  <time className="text-xs text-faint">{fmtDateTime(r.received_at)}</time>
                </div>
                {r.excerpt && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] text-muted">ดูข้อความ</summary>
                    <pre className="num mt-2 max-h-48 overflow-auto rounded-lg border border-line bg-panel-2 p-3 text-[11px] whitespace-pre-wrap text-muted">{r.excerpt}</pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="ยังไม่มี Alert เข้ามา" />
        )}
      </Card>
    </>
  );
}
