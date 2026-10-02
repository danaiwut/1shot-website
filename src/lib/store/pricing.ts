import type { Order, OrderStatus, ProductPrice } from "../types";

const thb = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
export const fmtTHB = (satang: number) => thb.format(satang / 100).replace(/\s/g, "");

type PriceTerms = Pick<ProductPrice, "billing" | "interval" | "duration_days">;

/** "รายเดือน", "90 วัน", "ตลอดชีพ" … */
export function termLabel(p: PriceTerms) {
  if (p.billing === "subscription") return p.interval === "year" ? "รายปี" : "รายเดือน";
  if (!p.duration_days) return "ตลอดชีพ";
  if (p.duration_days % 365 === 0) return `${p.duration_days / 365} ปี`;
  if (p.duration_days % 30 === 0) return `${p.duration_days / 30} เดือน`;
  return `${p.duration_days} วัน`;
}

/** Short suffix after the amount: "/เดือน", "/ปี", "· 90 วัน", "· ตลอดชีพ". */
export function priceSuffix(p: PriceTerms) {
  if (p.billing === "subscription") return p.interval === "year" ? "/ปี" : "/เดือน";
  return `· ${termLabel(p)}`;
}

/** Monthly-equivalent amount, used to show bundle savings. */
export function perMonthSatang(p: ProductPrice) {
  if (p.billing === "subscription") return p.interval === "year" ? p.amount_satang / 12 : p.amount_satang;
  return p.duration_days ? (p.amount_satang / p.duration_days) * 30 : null;
}

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: "neutral" | "brand" | "buy" | "sell" | "info" }> = {
  pending: { label: "รอชำระ", tone: "brand" },
  paid: { label: "ชำระแล้ว", tone: "buy" },
  failed: { label: "ไม่สำเร็จ", tone: "sell" },
  canceled: { label: "ยกเลิก", tone: "neutral" },
  refunded: { label: "คืนเงินแล้ว", tone: "info" },
};

export const SUB_STATUS: Record<string, { label: string; tone: "neutral" | "brand" | "buy" | "sell" | "info" }> = {
  active: { label: "ใช้งานอยู่", tone: "buy" },
  trialing: { label: "ทดลองใช้", tone: "buy" },
  past_due: { label: "ค้างชำระ", tone: "sell" },
  unpaid: { label: "ค้างชำระ", tone: "sell" },
  incomplete: { label: "รอชำระ", tone: "brand" },
  incomplete_expired: { label: "หมดอายุ", tone: "neutral" },
  canceled: { label: "ยกเลิกแล้ว", tone: "neutral" },
  paused: { label: "พักไว้", tone: "neutral" },
};

export const orderTerm = (o: Pick<Order, "billing" | "interval" | "duration_days">) =>
  termLabel({ billing: o.billing, interval: o.interval as ProductPrice["interval"], duration_days: o.duration_days });
