import Link from "next/link";
import { EmptyLine, Section, Status, TableBox, Td, Th } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { Notice } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { fmtDateTime } from "@/lib/format";
import { EmailPreview } from "./preview";

export const metadata = { title: "อีเมลที่ส่ง" };

type Row = {
  id: number; user_id: string | null; order_id: string | null; kind: "purchase" | "renewal" | "refund";
  to_email: string; subject: string; html: string; status: "sent" | "failed" | "logged"; error: string | null; created_at: string;
};
const KIND = { purchase: "ซื้อสำเร็จ", renewal: "ต่ออายุ", refund: "คืนเงิน" } as const;
const STATUS = {
  sent: { label: "ส่งแล้ว", tone: "good" },
  failed: { label: "ส่งไม่สำเร็จ", tone: "bad" },
  logged: { label: "บันทึกไว้ (ไม่ได้ส่ง)", tone: "neutral" },
} as const;

export default async function EmailsPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("email_log").select("*").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as Row[];
  const configured = Boolean(serverEnv.resendApiKey() && serverEnv.emailFrom());

  const failed = rows.filter((r) => r.status === "failed").length;

  return (
    <>
      <PageHeader title="อีเมลที่ส่ง" description="อีเมลแจ้งลูกค้าเมื่อซื้อสำเร็จ ต่ออายุ และคืนเงิน 100 รายการล่าสุด" />
      <div className="space-y-10">
        {!configured && (
          <Notice>
            ยังไม่ได้ตั้ง RESEND_API_KEY และ EMAIL_FROM อีเมลจึงถูกบันทึกไว้แต่ยังไม่ได้ส่ง
          </Notice>
        )}
        <Section
          title="อีเมลล่าสุด"
          description={`${rows.length} รายการ${failed ? ` · ส่งไม่สำเร็จ ${failed}` : ""}`}
          action={<Status tone={configured ? "good" : "neutral"}>{configured ? "เชื่อม Resend แล้ว" : "ยังไม่ได้ตั้งค่าการส่ง"}</Status>}
        >
          {rows.length ? (
            <TableBox caption={`อีเมลที่ส่ง ${rows.length} รายการ`} minWidth={860}>
              <thead className="bg-panel-2">
                <tr>
                  <Th>เวลา</Th>
                  <Th>ผู้รับ</Th>
                  <Th>หัวข้อ</Th>
                  <Th>ประเภท</Th>
                  <Th>สถานะ</Th>
                  <Th className="text-right"><span className="sr-only">ตัวอย่าง</span></Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-line align-top">
                    <Td className="num whitespace-nowrap text-muted tabular-nums">{fmtDateTime(r.created_at)}</Td>
                    <Td>
                      {r.user_id ? <Link href={`/admin/members/${r.user_id}`} className="inline-flex min-h-11 items-center font-medium underline-offset-4 hover:text-accent hover:underline">{r.to_email}</Link> : r.to_email}
                    </Td>
                    <Td>
                      <span className="block max-w-sm font-medium">{r.subject}</span>
                      {r.error && <span className="mt-0.5 block max-w-sm text-xs text-sell">{r.error}</span>}
                    </Td>
                    <Td className="whitespace-nowrap">{KIND[r.kind]}</Td>
                    <Td><Status tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Status></Td>
                    <Td className="text-right"><EmailPreview subject={r.subject} to={r.to_email} html={r.html} /></Td>
                  </tr>
                ))}
              </tbody>
            </TableBox>
          ) : (
            <EmptyLine>ยังไม่มีอีเมล อีเมลจะถูกส่งเมื่อมีการซื้อสำเร็จหรือคืนเงิน</EmptyLine>
          )}
        </Section>
      </div>
    </>
  );
}
