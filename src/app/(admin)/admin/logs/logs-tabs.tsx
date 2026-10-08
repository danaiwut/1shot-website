import { Segmented } from "@/components/app/kit";
import { FilterLink } from "@/components/ui";

export const LOG_TABS = [
  { id: "emails", label: "อีเมล", line: "อีเมลแจ้งลูกค้าเมื่อซื้อสำเร็จ ต่ออายุ และคืนเงิน 100 รายการล่าสุด" },
  { id: "webhooks", label: "Webhook TradingView", line: "Alert จาก TradingView 100 รายการล่าสุด" },
  { id: "access", label: "ประวัติการให้สิทธิ์", line: "บันทึกทุกการเพิ่ม ต่ออายุ ถอนสิทธิ์ เปลี่ยนบทบาท และตรวจ IB — ทั้งจากทีมงานและจากการชำระเงิน 200 รายการล่าสุด" },
] as const;
export type LogTab = (typeof LOG_TABS)[number]["id"];
export const logTab = (v: unknown) => LOG_TABS.find((t) => t.id === v) ?? LOG_TABS[0];

/** "บันทึกระบบ" is one place: emails sent, TradingView alerts received, and who changed whose access. */
export function LogsTabs({ on }: { on: LogTab }) {
  return (
    <div className="-mx-1 mb-8 overflow-x-auto px-1 py-0.5">
      <Segmented label="บันทึกระบบ" className="max-w-none flex-nowrap">
        {LOG_TABS.map((t) => <FilterLink key={t.id} href={`/admin/logs?tab=${t.id}`} on={on === t.id} className="min-h-11 px-5">{t.label}</FilterLink>)}
      </Segmented>
    </div>
  );
}
