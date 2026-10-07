import { ChevronDown } from "lucide-react";
import { Section, Status } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { requireStaff } from "@/lib/auth";
import { loadIndicators } from "@/lib/indicators";
import { IndicatorForm } from "./indicator-form";

export const metadata = { title: "อินดิเคเตอร์และห้อง" };

export default async function IndicatorsAdminPage() {
  const { supabase } = await requireStaff();
  const [indicators, { data: rooms }] = await Promise.all([
    loadIndicators(supabase),
    supabase.from("indicators").select("code, telegram_room_id, tv_script_id"),
  ]);
  const rows = (rooms ?? []) as { code: string; telegram_room_id: string | null; tv_script_id: string | null }[];
  const room = (code: string) => rows.find((r) => r.code === code)?.telegram_room_id ?? null;
  const script = (code: string) => rows.find((r) => r.code === code)?.tv_script_id ?? null;
  const missingImage = indicators.filter((i) => !i.image_url).length;
  const missingRoom = indicators.filter((i) => !i.is_reference && !room(i.code)).length;

  return (
    <>
      <PageHeader
        title="อินดิเคเตอร์และห้อง Telegram"
        description="แก้ชื่อ คำอธิบาย จุดเด่น และรูปที่แสดงบนหน้าเว็บ รวมถึงผูกห้อง Telegram ของแต่ละอินดิเคเตอร์ การเปลี่ยนแปลงขึ้นบนหน้าเว็บทันที"
      />
      <Section
        title="อินดิเคเตอร์ทั้งหมด"
        description={`${indicators.length} ตัว · ยังไม่มีรูป ${missingImage} · ยังไม่ผูกห้อง ${missingRoom}`}
      >
        <ul className="divide-y divide-line">
          {indicators.map((i) => {
            const noRoom = !i.is_reference && !room(i.code);
            return (
              <li key={i.code}>
                <details className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-panel-2 sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span className="num w-10 shrink-0 text-sm font-semibold text-accent">{i.code}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{i.name}</span>
                      <span className="block text-sm text-muted">{i.family} · {i.modes.join(" / ") || "ข้อมูลอ้างอิง"}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {i.is_reference ? <Status>อ้างอิง</Status> : noRoom ? <Status tone="bad">ยังไม่ผูกห้อง</Status> : <Status tone="good">ผูกห้องแล้ว</Status>}
                      {!i.image_url && <Status tone="warn">ยังไม่มีรูป</Status>}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                      <span className="group-open:hidden">แก้ไข</span><span className="hidden group-open:inline">ปิด</span>
                      <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  <div className="border-t border-line bg-panel-2 p-4 sm:p-5"><IndicatorForm indicator={i} room={room(i.code)} script={script(i.code)} /></div>
                </details>
              </li>
            );
          })}
        </ul>
      </Section>
    </>
  );
}
