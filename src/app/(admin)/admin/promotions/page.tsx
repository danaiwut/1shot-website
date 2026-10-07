import { ChevronDown } from "lucide-react";
import { EmptyLine, Section, SettingsSection, Status } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { requireStaff } from "@/lib/auth";
import { SalesTabs } from "../_components/sales-tabs";
import { fmtDate } from "@/lib/format";
import { bangkokToday } from "@/lib/promotions";
import type { Promotion } from "@/lib/types";
import { PromotionForm } from "./forms";

export const metadata = { title: "โปรโมชัน" };

export default async function AdminPromotionsPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("promotions").select("*").order("starts_on", { ascending: false }).limit(60);
  const list = (data ?? []) as Promotion[];
  const today = bangkokToday();
  const state = (p: Promotion) =>
    !p.active ? { tone: "neutral" as const, label: "ปิดอยู่" }
      : p.ends_on < today ? { tone: "neutral" as const, label: "หมดเวลาแล้ว" }
        : p.starts_on > today ? { tone: "warn" as const, label: "รอเริ่ม" }
          : { tone: "good" as const, label: "กำลังแสดง" };
  const running = list.find((p) => state(p).label === "กำลังแสดง");

  return (
    <>
      <PageHeader title="ราคาและโปร" description={running ? `ป้ายที่แสดงบนหน้าแรกตอนนี้: ${running.title}` : "ตอนนี้ยังไม่มีป้ายโปรบนหน้าแรก"} />
      <SalesTabs on="promotions" />
      <div className="space-y-10">
        <SettingsSection title="สร้างป้ายโปร" description="ป้ายนี้แสดงข้างรายการอินดิเคเตอร์บนหน้าแรก ตามวันที่ที่ตั้งไว้ ส่วนราคาโปรจริงตั้งที่แท็บ “สินค้า ราคา และโปรจับคู่”">
          <PromotionForm today={today} />
        </SettingsSection>
        <Section title="โปรโมชันทั้งหมด" description={`${list.length} รายการ`}>
          {list.length ? (
            <ul className="divide-y divide-line">
              {list.map((p) => {
                const st = state(p);
                return (
                  <li key={p.id}>
                    <details className="group">
                      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-panel-2 sm:px-5 [&::-webkit-details-marker]:hidden">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{p.title}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted">
                            <Status tone={st.tone}>{st.label}</Status>
                            <span className="num">{fmtDate(p.starts_on)} – {fmtDate(p.ends_on)}</span>
                            {p.code && <span className="num">โค้ด {p.code}</span>}
                          </span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent">
                          <span className="group-open:hidden">แก้ไข</span><span className="hidden group-open:inline">ปิด</span>
                          <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
                        </span>
                      </summary>
                      <div className="border-t border-line bg-panel-2 p-4 sm:p-5"><PromotionForm item={p} today={today} /></div>
                    </details>
                  </li>
                );
              })}
            </ul>
          ) : <EmptyLine>ยังไม่มีโปรโมชัน</EmptyLine>}
        </Section>
      </div>
    </>
  );
}
