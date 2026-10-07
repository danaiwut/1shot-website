import { ChevronRight, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Empty } from "@/components/ui";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaff } from "@/lib/auth";
import { publicEnv, serverEnv } from "@/lib/env";
import { fmtDateTime } from "@/lib/format";
import { Panel, td, Th, theadRow } from "../_components/admin-ui";

export const metadata = { title: "บันทึก Webhook" };

type Receipt = { id: number; received_at: string; ok: boolean; inserted: number; error: string | null; excerpt: string | null };

export default async function WebhooksPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("webhook_receipts").select("*").order("received_at", { ascending: false }).limit(100);
  const secret = serverEnv.webhookSecret();
  const masked = secret ? `${secret.slice(0, 4)}••••${secret.slice(-2)}` : "(ยังไม่ได้ตั้ง TRADINGVIEW_WEBHOOK_SECRET)";

  const receipts = (data ?? []) as Receipt[];
  const rejected = receipts.filter((r) => !r.ok).length;
  const inserted = receipts.reduce((n, r) => n + (r.ok ? r.inserted : 0), 0);

  return (
    <>
      <PageHeader eyebrow="ผู้ดูแลระบบ" title="บันทึก Webhook" description="Alert จาก TradingView 100 รายการล่าสุด" />

      <Panel className="mb-6" title="Webhook URL" description="URL สำหรับตั้งใน TradingView Alert → Webhook URL" action={<Badge tone={secret ? "buy" : "sell"}>{secret ? "ตั้ง secret แล้ว" : "ยังไม่ได้ตั้ง secret"}</Badge>}>
        <div className="space-y-2 p-4 sm:p-6">
          <code className="num block overflow-x-auto rounded-lg border border-line bg-panel-2 px-3 py-3 text-xs whitespace-nowrap">{publicEnv.siteUrl()}/api/webhook/tradingview/{masked}</code>
          <p className="flex items-start gap-2 text-sm text-muted"><KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />ใช้ค่า secret จริงจากตัวแปรสภาพแวดล้อม เก็บ URL นี้เป็นความลับ ใครได้ไปก็ส่งสัญญาณปลอมเข้าระบบได้</p>
        </div>
      </Panel>

      <Panel title="รายการล่าสุด" description={`${receipts.length} รายการ · บันทึกสัญญาณ ${inserted} · ปฏิเสธ ${rejected}`}>
        {receipts.length ? (
          <Table className="min-w-[680px]">
            <caption className="sr-only">Alert จาก TradingView {receipts.length} รายการล่าสุด</caption>
            <TableHeader>
              <TableRow className={theadRow}>
                <Th>เวลา</Th>
                <Th>ผลลัพธ์</Th>
                <Th>รายละเอียด</Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((r) => (
                <TableRow key={r.id} className="border-line align-top">
                  <TableCell className={`${td} text-muted`}><time dateTime={r.received_at}>{fmtDateTime(r.received_at)}</time></TableCell>
                  <TableCell className={td}>
                    <Badge tone={r.ok ? (r.inserted ? "buy" : "neutral") : "sell"}>{r.ok ? (r.inserted ? `บันทึก ${r.inserted}` : "ซ้ำ") : "ปฏิเสธ"}</Badge>
                  </TableCell>
                  <TableCell className={`${td} w-full whitespace-normal`}>
                    {r.error && <p className="text-sm text-sell">{r.error}</p>}
                    {r.excerpt ? (
                      <details className="group">
                        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-medium text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
                          <ChevronRight aria-hidden className="size-4 transition-transform group-open:rotate-90" /> ดูข้อความ
                        </summary>
                        <pre className="num mt-1 max-h-48 max-w-xl overflow-auto rounded-lg border border-line bg-panel-2 p-3 text-xs whitespace-pre-wrap text-muted">{r.excerpt}</pre>
                      </details>
                    ) : !r.error && <span className="text-faint">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty title="ยังไม่มี Alert เข้ามา" />
        )}
      </Panel>
    </>
  );
}
