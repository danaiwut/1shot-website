import { fmtDate } from "../format";
import { fmtTHB, orderTerm } from "../store/pricing";
import type { Order } from "../types";

// Email HTML: inline styles and tables only, so it renders the same in Gmail, Outlook and mobile clients.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const RED = "#b20016";

function layout({ site, preheader, title, intro, rows, cta, note }: {
  site: string;
  preheader: string;
  title: string;
  intro: string;
  rows: [string, string][];
  cta?: { href: string; label: string };
  note?: string;
}) {
  const rowsHtml = rows.map(([k, v]) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eeeeee;color:#666666;font-size:14px;">${esc(k)}</td>
      <td style="padding:12px 0;border-bottom:1px solid #eeeeee;color:#000000;font-size:14px;font-weight:600;text-align:right;">${esc(v)}</td>
    </tr>`).join("");
  return `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Noto Sans Thai','Sukhumvit Set','Leelawadee UI',Tahoma,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;">
        <tr><td style="background:#000000;padding:28px 32px;">
          <img src="${esc(site)}/brand/logo.png" width="132" height="46" alt="1SHOT" style="display:block;border:0;height:46px;width:132px;">
          <h1 style="margin:28px 0 0;color:#ffffff;font-size:26px;line-height:1.3;">${esc(title)}</h1>
        </td></tr>
        <tr><td style="padding:28px 32px 8px;">
          <p style="margin:0 0 20px;color:#333333;font-size:15px;line-height:1.7;">${esc(intro)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
          ${cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr><td style="background:${RED};border-radius:12px;">
            <a href="${esc(cta.href)}" style="display:inline-block;padding:14px 26px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${esc(cta.label)} →</a>
          </td></tr></table>` : ""}
          ${note ? `<p style="margin:20px 0 0;color:#666666;font-size:13px;line-height:1.7;">${esc(note)}</p>` : ""}
        </td></tr>
        <tr><td style="padding:24px 32px 28px;color:#8c8c8c;font-size:11px;line-height:1.7;">
          อีเมลนี้ส่งอัตโนมัติจาก 1SHOT Signals เกี่ยวกับคำสั่งซื้อของคุณ<br>
          การเทรดทองคำและ CFD มีความเสี่ยงสูง สัญญาณไม่ใช่คำแนะนำการลงทุนเฉพาะบุคคล
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const textOf = (title: string, intro: string, rows: [string, string][], link?: string, note?: string) =>
  [title, "", intro, "", ...rows.map(([k, v]) => `${k}: ${v}`), ...(link ? ["", link] : []), ...(note ? ["", note] : [])].join("\n");

const access = (o: Order) => (o.access_until ? fmtDate(o.access_until) : o.billing === "one_time" ? "ตลอดชีพ" : "—");

export function purchaseEmail(o: Order, name: string, site: string) {
  const renewal = o.kind === "renewal";
  const title = renewal ? "ต่ออายุสำเร็จ" : "ชำระเงินสำเร็จ";
  const subject = renewal ? `ต่ออายุ ${o.product_name} สำเร็จ · 1SHOT` : `ยืนยันการสั่งซื้อ ${o.product_name} · 1SHOT`;
  const intro = renewal
    ? `สวัสดีคุณ${name} ระบบตัดบัตรงวดใหม่ของ ${o.product_name} เรียบร้อยแล้ว สิทธิ์ของคุณต่ออายุให้อัตโนมัติ`
    : `สวัสดีคุณ${name} ขอบคุณที่สั่งซื้อ สิทธิ์ใช้งานอินดิเคเตอร์ของคุณพร้อมแล้ว เข้าแดชบอร์ดเพื่อดูสัญญาณและขอลิงก์เข้าห้อง Telegram ได้ทันที`;
  const rows: [string, string][] = [
    ["สินค้า", `${o.product_name} · ${orderTerm(o)}`],
    ["ยอดชำระ", fmtTHB(o.amount_satang)],
    ["อินดิเคเตอร์", o.codes.join(" · ")],
    ["ใช้ได้ถึง", access(o)],
    ["เลขที่คำสั่งซื้อ", o.id.slice(0, 8).toUpperCase()],
  ];
  const note = o.billing === "subscription" ? "แพ็กเกจนี้ต่ออายุอัตโนมัติทุกงวด ยกเลิกได้ทุกเมื่อที่หน้าการชำระเงิน" : undefined;
  const cta = { href: `${site}/dashboard`, label: "ไปที่แดชบอร์ด" };
  return {
    subject,
    html: layout({ site, preheader: `${o.product_name} · ${fmtTHB(o.amount_satang)}`, title, intro, rows, cta, note }),
    text: textOf(title, intro, rows, cta.href, note),
  };
}

export function refundEmail(o: Order, name: string, site: string, subscriptionCanceled: boolean) {
  const title = "คืนเงินเรียบร้อย";
  const subject = `คืนเงิน ${o.product_name} · 1SHOT`;
  const intro = `สวัสดีคุณ${name} เราคืนเงินคำสั่งซื้อ ${o.product_name} ให้คุณเต็มจำนวนแล้ว เงินจะกลับเข้าบัตรหรือบัญชีเดิมภายใน 5–10 วันทำการ ขึ้นกับธนาคาร`;
  const rows: [string, string][] = [
    ["สินค้า", `${o.product_name} · ${orderTerm(o)}`],
    ["ยอดคืน", fmtTHB(o.amount_satang)],
    ["สิทธิ์ที่ถูกถอน", o.codes.join(" · ")],
    ["เลขที่คำสั่งซื้อ", o.id.slice(0, 8).toUpperCase()],
  ];
  const note = [
    "สิทธิ์ที่ได้จากคำสั่งซื้อนี้ถูกถอนแล้ว สิทธิ์จากการซื้ออื่นยังใช้ได้ตามเดิม",
    subscriptionCanceled ? "การสมัครแบบรายงวดของแพ็กเกจนี้ถูกยกเลิกแล้ว จะไม่มีการตัดเงินงวดถัดไป" : "",
  ].filter(Boolean).join(" ");
  const cta = { href: `${site}/store#history`, label: "ดูประวัติการชำระเงิน" };
  return {
    subject,
    html: layout({ site, preheader: `คืนเงิน ${fmtTHB(o.amount_satang)}`, title, intro, rows, cta, note }),
    text: textOf(title, intro, rows, cta.href, note),
  };
}
