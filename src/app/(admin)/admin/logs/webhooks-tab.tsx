import { ChevronRight, Webhook } from "lucide-react";
import { Section, Segmented, Status, TableBox, Td, TextLink, Th } from "@/components/app/kit";
import { FilterLink } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { publicEnv, serverEnv } from "@/lib/env";
import { fmtDateTime } from "@/lib/format";
import { EmptyState, qs, Toolbar } from "@/components/app/toolbar";

type Receipt = { id: number; received_at: string; ok: boolean; inserted: number; error: string | null; excerpt: string | null };
const FILTERS = [
  { id: "", label: "ทั้งหมด", test: (_: Receipt) => true },
  { id: "saved", label: "บันทึกแล้ว", test: (r: Receipt) => r.ok && r.inserted > 0 },
  { id: "dup", label: "ซ้ำ", test: (r: Receipt) => r.ok && !r.inserted },
  { id: "rejected", label: "ปฏิเสธ", test: (r: Receipt) => !r.ok },
];

export async function WebhooksTab({ result = "" }: { result?: string }) {
  const f = FILTERS.find((x) => x.id === result) ?? FILTERS[0];
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("webhook_receipts").select("*").order("received_at", { ascending: false }).limit(100);
  const secret = serverEnv.webhookSecret();
  const masked = secret ? `${secret.slice(0, 4)}••••${secret.slice(-2)}` : "(ยังไม่ได้ตั้ง TRADINGVIEW_WEBHOOK_SECRET)";

  const receipts = (data ?? []) as Receipt[];
  const rows = receipts.filter(f.test);
  const rejected = receipts.filter((r) => !r.ok).length;
  const inserted = receipts.reduce((n, r) => n + (r.ok ? r.inserted : 0), 0);

  return (
    <div className="space-y-10">
      <Section title="Webhook URL" description="URL สำหรับตั้งใน TradingView Alert → Webhook URL" action={<Status tone={secret ? "good" : "bad"}>{secret ? "ตั้ง secret แล้ว" : "ยังไม่ได้ตั้ง secret"}</Status>}>
        <div className="space-y-2 px-4 py-5 sm:px-6">
          <code className="num block overflow-x-auto rounded-xl border border-line bg-panel-2 px-4 py-3 text-sm whitespace-nowrap">{publicEnv.siteUrl()}/api/webhook/tradingview/{masked}</code>
          <p className="text-sm text-muted">ใช้ค่า secret จริงจากตัวแปรสภาพแวดล้อม เก็บ URL นี้เป็นความลับ ใครได้ไปก็ส่งสัญญาณปลอมเข้าระบบได้</p>
        </div>
      </Section>

      <Section
        title={<>รายการล่าสุด <span className="num ml-1 text-sm font-normal text-muted tabular-nums">{rows.length} รายการ</span></>}
        description={`จาก ${receipts.length} รายการ · บันทึกสัญญาณ ${inserted} · ปฏิเสธ ${rejected}`}
      >
        <Toolbar>
          <Segmented label="กรองตามผลลัพธ์">
            {FILTERS.map((x) => (
              <FilterLink key={x.id} href={qs("/admin/logs", { tab: "webhooks", result: x.id })} on={f.id === x.id}>
                {x.label} <span className="num tabular-nums opacity-70">{receipts.filter(x.test).length}</span>
              </FilterLink>
            ))}
          </Segmented>
        </Toolbar>
        {rows.length ? (
          <TableBox caption={`Alert จาก TradingView ${rows.length} รายการ`} minWidth={560}>
            <thead>
              <tr>
                <Th>เวลา</Th>
                <Th>ผลลัพธ์</Th>
                <Th>รายละเอียด</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line align-top">
                  <Td className="whitespace-nowrap"><time dateTime={r.received_at} className="num font-semibold tabular-nums">{fmtDateTime(r.received_at)}</time></Td>
                  <Td>
                    <Status tone={r.ok ? (r.inserted ? "good" : "neutral") : "bad"}>{r.ok ? (r.inserted ? `บันทึก ${r.inserted}` : "ซ้ำ") : "ปฏิเสธ"}</Status>
                  </Td>
                  <Td className="w-full">
                    {r.error && <p className="text-sm font-medium text-sell">{r.error}</p>}
                    {r.excerpt ? (
                      <details className="group">
                        <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 text-sm font-semibold text-accent [&::-webkit-details-marker]:hidden">
                          <ChevronRight aria-hidden className="size-4 transition-transform group-open:rotate-90" /> ดูข้อความ
                        </summary>
                        <pre className="num mt-1 max-h-60 max-w-2xl overflow-auto rounded-xl border border-line bg-panel-2 p-3 text-xs whitespace-pre-wrap text-muted">{r.excerpt}</pre>
                      </details>
                    ) : !r.error && <span className="text-faint">—</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableBox>
        ) : receipts.length ? (
          <EmptyState icon={<Webhook />} title="ไม่มีรายการในหมวดนี้" action={<TextLink href="/admin/logs?tab=webhooks">ดูทั้งหมด</TextLink>} />
        ) : (
          <EmptyState icon={<Webhook />} title="ยังไม่มี Alert เข้ามา">คัดลอก Webhook URL ด้านบนไปใส่ใน TradingView Alert แล้วรอสัญญาณแรก</EmptyState>
        )}
      </Section>
    </div>
  );
}
