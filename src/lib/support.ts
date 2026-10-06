import { fmtDate, ROLE_LABEL } from "./format";
import type { AuditEntry, SupportKind, SupportStatus } from "./types";

export const SUPPORT_KIND: Record<SupportKind, string> = {
  rights: "สิทธิ์ 1Shot Indicators",
  room: "ห้องสมาชิก",
  help: "ความช่วยเหลือ",
};

export const SUPPORT_STATUS: Record<SupportStatus, { label: string; tone: "brand" | "buy" | "neutral"; hint: string }> = {
  open: { label: "รอทีมงานตอบ", tone: "brand", hint: "ทีมงานจะตอบกลับในหน้านี้" },
  answered: { label: "ทีมงานตอบแล้ว", tone: "buy", hint: "อ่านคำตอบและตอบกลับได้" },
  resolved: { label: "เสร็จสิ้น", tone: "neutral", hint: "ปิดเรื่องแล้ว ตอบกลับเพื่อเปิดใหม่ได้" },
};

/** Subject line shown in lists: kind + indicator. */
export const requestSubject = (kind: SupportKind, code: string | null) => (code ? `${SUPPORT_KIND[kind]} · ${code}` : SUPPORT_KIND[kind]);

const expiry = (v: unknown) => (v ? `ถึง ${fmtDate(String(v))}` : "ตลอดชีพ");

/** One plain-Thai sentence per audit entry. */
export function describeAudit(e: Pick<AuditEntry, "action" | "detail">): { title: string; detail?: string } {
  const d = e.detail ?? {};
  switch (e.action) {
    case "right.grant":
      return {
        title: d.op === "insert" ? `เพิ่มสิทธิ์ ${d.code}` : `ต่ออายุหรือแก้ไขสิทธิ์ ${d.code}`,
        detail: [expiry(d.expires_at), d.op === "update" ? `เดิม ${expiry(d.previous)}` : "", d.note ? String(d.note) : ""].filter(Boolean).join(" · "),
      };
    case "right.revoke":
      return { title: `ถอนสิทธิ์ ${d.code}`, detail: d.note ? String(d.note) : undefined };
    case "role.change":
      return { title: `เปลี่ยนบทบาทเป็น${ROLE_LABEL[String(d.to)] ?? d.to}`, detail: [`จาก${ROLE_LABEL[String(d.from)] ?? d.from}`, d.reason ? `เหตุผล: ${d.reason}` : ""].filter(Boolean).join(" · ") };
    case "ib.verify":
      return { title: "ยืนยันบัญชี Exness IB", detail: d.exness_account ? `บัญชี ${d.exness_account}` : undefined };
    case "ib.unverify":
      return { title: "ยกเลิกการยืนยัน IB", detail: d.exness_account ? `บัญชี ${d.exness_account}` : undefined };
    case "telegram.unlink":
      return { title: "ยกเลิกการเชื่อม Telegram" };
    case "support.reply":
      return { title: "ทีมงานตอบคำขอ", detail: d.subject ? String(d.subject) : undefined };
    default:
      return { title: e.action };
  }
}
