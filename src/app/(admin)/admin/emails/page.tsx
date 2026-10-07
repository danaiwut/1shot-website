import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Empty, Notice } from "@/components/ui";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaff } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { fmtDateTime } from "@/lib/format";
import { Panel, td, Th, theadRow } from "../_components/admin-ui";
import { EmailPreview } from "./preview";

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

  const failed = rows.filter((r) => r.status === "failed").length;

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
      <Panel
        title="อีเมลล่าสุด"
        description={`${rows.length} รายการ${failed ? ` · ส่งไม่สำเร็จ ${failed}` : ""}`}
        action={<Badge tone={configured ? "buy" : "neutral"}>{configured ? "เชื่อม Resend แล้ว" : "ยังไม่ได้ตั้งค่าการส่ง"}</Badge>}
      >
        {rows.length ? (
          <Table className="min-w-[860px]">
            <caption className="sr-only">อีเมลที่ส่ง {rows.length} รายการ</caption>
            <TableHeader>
              <TableRow className={theadRow}>
                <Th>เวลา</Th>
                <Th>ผู้รับ</Th>
                <Th>หัวข้อ</Th>
                <Th>ประเภท</Th>
                <Th>สถานะ</Th>
                <Th className="text-right"><span className="sr-only">ตัวอย่าง</span></Th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="border-line align-top">
                  <TableCell className={`${td} text-muted`}>{fmtDateTime(r.created_at)}</TableCell>
                  <TableCell className={td}>
                    {r.user_id ? <Link href={`/admin/members/${r.user_id}`} className="inline-flex min-h-11 items-center font-medium underline-offset-4 hover:text-accent hover:underline">{r.to_email}</Link> : r.to_email}
                  </TableCell>
                  <TableCell className={`${td} whitespace-normal`}>
                    <span className="block max-w-sm font-medium">{r.subject}</span>
                    {r.error && <span className="mt-0.5 block max-w-sm text-xs text-sell">{r.error}</span>}
                  </TableCell>
                  <TableCell className={td}><Badge>{KIND[r.kind]}</Badge></TableCell>
                  <TableCell className={td}><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge></TableCell>
                  <TableCell className={`${td} text-right`}><EmailPreview subject={r.subject} to={r.to_email} html={r.html} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty title="ยังไม่มีอีเมล">อีเมลจะถูกส่งเมื่อมีการซื้อสำเร็จหรือคืนเงิน</Empty>
        )}
      </Panel>
    </>
  );
}
