import Link from "next/link";
import { Mail } from "lucide-react";
import { Section, Segmented, Status, TableBox, Td, TextLink, Th } from "@/components/app/kit";
import { FilterLink, Notice } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { fmtDateTime } from "@/lib/format";
import { EmailPreview } from "./email-preview";
import { EmptyState, matches, qs, Toolbar } from "@/components/app/toolbar";

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
const FILTERS = [{ id: "", label: "ทั้งหมด" }, { id: "sent", label: "ส่งแล้ว" }, { id: "failed", label: "ส่งไม่สำเร็จ" }, { id: "logged", label: "ไม่ได้ส่ง" }] as const;

export async function EmailsTab({ status = "", q = "" }: { status?: string; q?: string }) {
  const f = FILTERS.find((x) => x.id === status) ?? FILTERS[0];
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("email_log").select("*").order("created_at", { ascending: false }).limit(100);
  const all = (data ?? []) as Row[];
  const rows = all.filter((r) => (!f.id || r.status === f.id) && matches(q, r.to_email, r.subject));
  const configured = Boolean(serverEnv.resendApiKey() && serverEnv.emailFrom());
  const count = (id: string) => all.filter((r) => !id || r.status === id).length;

  return (
    <div className="space-y-6">
      {!configured && (
        <Notice>
          ยังไม่ได้ตั้ง RESEND_API_KEY และ EMAIL_FROM อีเมลจึงถูกบันทึกไว้แต่ยังไม่ได้ส่ง
        </Notice>
      )}
      <Section
        title={<>อีเมลล่าสุด <span className="num ml-1 text-sm font-normal text-muted tabular-nums">{rows.length} รายการ</span></>}
        action={<Status tone={configured ? "good" : "neutral"}>{configured ? "เชื่อม Resend แล้ว" : "ยังไม่ได้ตั้งค่าการส่ง"}</Status>}
      >
        <Toolbar q={q} placeholder="อีเมลผู้รับ หรือหัวข้อ" keep={{ tab: "emails", status: f.id }}>
          <Segmented label="กรองอีเมลตามสถานะ">
            {FILTERS.map((x) => (
              <FilterLink key={x.id} href={qs("/admin/logs", { tab: "emails", status: x.id, q })} on={f.id === x.id}>
                {x.label} <span className="num tabular-nums opacity-70">{count(x.id)}</span>
              </FilterLink>
            ))}
          </Segmented>
        </Toolbar>
        {rows.length ? (
          <TableBox caption={`อีเมลที่ส่ง ${rows.length} รายการ`} minWidth={600}>
            <thead>
              <tr>
                <Th>หัวข้อ · ผู้รับ</Th>
                <Th className="hidden md:table-cell">ประเภท</Th>
                <Th className="hidden lg:table-cell">เวลา</Th>
                <Th>สถานะ</Th>
                <Th className="text-right"><span className="sr-only">ตัวอย่าง</span></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <Td>
                    <span className="block max-w-md font-bold">{r.subject}</span>
                    <span className="block text-xs text-muted">
                      ถึง {r.user_id ? <Link href={`/admin/members/${r.user_id}`} className="font-medium text-fg underline-offset-4 hover:text-accent hover:underline">{r.to_email}</Link> : r.to_email}
                      <span className="md:hidden"> · {KIND[r.kind]}</span>
                      <span className="num lg:hidden"> · {fmtDateTime(r.created_at)}</span>
                    </span>
                    {r.error && <span className="mt-1 block max-w-md text-xs text-sell">{r.error}</span>}
                  </Td>
                  <Td className="hidden whitespace-nowrap md:table-cell">{KIND[r.kind]}</Td>
                  <Td className="num hidden whitespace-nowrap text-muted tabular-nums lg:table-cell">{fmtDateTime(r.created_at)}</Td>
                  <Td><Status tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Status></Td>
                  <Td className="text-right"><EmailPreview subject={r.subject} to={r.to_email} html={r.html} /></Td>
                </tr>
              ))}
            </tbody>
          </TableBox>
        ) : all.length ? (
          <EmptyState icon={<Mail />} title="ไม่พบอีเมลที่ตรงกับเงื่อนไข" action={<TextLink href="/admin/logs?tab=emails">ล้างตัวกรองและการค้นหา</TextLink>} />
        ) : (
          <EmptyState icon={<Mail />} title="ยังไม่มีอีเมล">อีเมลจะถูกส่งเมื่อมีการซื้อสำเร็จ ต่ออายุ หรือคืนเงิน</EmptyState>
        )}
      </Section>
    </div>
  );
}
