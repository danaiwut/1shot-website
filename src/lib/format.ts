import type { SetupStatus } from "./types";

const TZ = "Asia/Bangkok";

export const fmtPrice = (n: number | null | undefined, digits = 2) =>
  n === null || n === undefined ? "—" : Number(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("th-TH", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—";

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat("th-TH", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)) : "—";

export function fmtRelative(iso: string, now = Date.now()) {
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "เมื่อสักครู่";
  if (s < 3600) return `${Math.floor(s / 60)} นาทีที่แล้ว`;
  if (s < 86400) return `${Math.floor(s / 3600)} ชม.ที่แล้ว`;
  return `${Math.floor(s / 86400)} วันที่แล้ว`;
}

/** Reward-to-risk of the setup's own TP, rounded to 0.1R. */
export function rMultiple(entry: number | null, sl: number | null, tp: number | null) {
  if (!entry || !sl || !tp || entry === sl) return null;
  return Math.round((Math.abs(tp - entry) / Math.abs(entry - sl)) * 10) / 10;
}

export const STATUS_LABEL: Record<SetupStatus, { label: string; tone: "brand" | "buy" | "sell" | "info" | "neutral" }> = {
  pending: { label: "รอเข้า", tone: "brand" },
  entry: { label: "เข้าแล้ว", tone: "info" },
  retest: { label: "รีเทสต์", tone: "info" },
  tp: { label: "ถึง TP", tone: "buy" },
  sl: { label: "โดน SL", tone: "sell" },
  cancel: { label: "ยกเลิก", tone: "neutral" },
  expired: { label: "หมดอายุ", tone: "neutral" },
  close: { label: "ปิดแล้ว", tone: "neutral" },
  info: { label: "ข้อมูล", tone: "neutral" },
};

export const isOpenStatus = (s: SetupStatus) => s === "pending" || s === "entry" || s === "retest";

export const ROLE_LABEL: Record<string, string> = { member: "สมาชิก", admin: "แอดมิน", owner: "เจ้าของ" };
