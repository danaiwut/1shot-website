import { ChevronRight } from "lucide-react";
import { EmptyLine, Section, Status, TableBox, Td, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { requireStaff } from "@/lib/auth";
import { publicEnv, serverEnv } from "@/lib/env";
import { fmtDateTime } from "@/lib/format";

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
      <PageHeader title="บันทึก Webhook" description="Alert จาก TradingView 100 รายการล่าสุด" />

      <div className="space-y-10">
        <Section title="Webhook URL" description="URL สำหรับตั้งใน TradingView Alert → Webhook URL" action={<Status tone={secret ? "good" : "bad"}>{secret ? "ตั้ง secret แล้ว" : "ยังไม่ได้ตั้ง secret"}</Status>}>
          <div className="space-y-2 px-4 py-4 sm:px-5">
            <code className="num block overflow-x-auto rounded-md border border-line bg-panel-2 px-3 py-3 text-xs whitespace-nowrap">{publicEnv.siteUrl()}/api/webhook/tradingview/{masked}</code>
            <p className="text-sm text-muted">ใช้ค่า secret จริงจากตัวแปรสภาพแวดล้อม เก็บ URL นี้เป็นความลับ ใครได้ไปก็ส่งสัญญาณปลอมเข้าระบบได้</p>
          </div>
        </Section>

        <Section title="รายการล่าสุด" description={`${receipts.length} รายการ · บันทึกสัญญาณ ${inserted} · ปฏิเสธ ${rejected}`}>
          {receipts.length ? (
            <TableBox caption={`Alert จาก TradingView ${receipts.length} รายการล่าสุด`} minWidth={680}>
              <thead className="bg-panel-2">
                <tr>
                  <Th>เวลา</Th>
                  <Th>ผลลัพธ์</Th>
                  <Th>รายละเอียด</Th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id} className="border-t border-line align-top">
                    <Td className="num whitespace-nowrap text-muted tabular-nums"><time dateTime={r.received_at}>{fmtDateTime(r.received_at)}</time></Td>
                    <Td>
                      <Status tone={r.ok ? (r.inserted ? "good" : "neutral") : "bad"}>{r.ok ? (r.inserted ? `บันทึก ${r.inserted}` : "ซ้ำ") : "ปฏิเสธ"}</Status>
                    </Td>
                    <Td className="w-full">
                      {r.error && <p className="text-sm text-sell">{r.error}</p>}
                      {r.excerpt ? (
                        <details className="group">
                          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-medium text-accent [&::-webkit-details-marker]:hidden">
                            <ChevronRight aria-hidden className="size-4 transition-transform group-open:rotate-90" /> ดูข้อความ
                          </summary>
                          <pre className="num mt-1 max-h-48 max-w-xl overflow-auto rounded-md border border-line bg-panel-2 p-3 text-xs whitespace-pre-wrap text-muted">{r.excerpt}</pre>
                        </details>
                      ) : !r.error && <span className="text-faint">—</span>}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableBox>
          ) : (
            <EmptyLine>ยังไม่มี Alert เข้ามา</EmptyLine>
          )}
        </Section>
      </div>
    </>
  );
}
