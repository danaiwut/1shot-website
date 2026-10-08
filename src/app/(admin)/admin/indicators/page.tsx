import { ChevronDown } from "lucide-react";
import { CARD, Section, StatRow, Status } from "@/components/app/kit";
import { cx } from "@/components/ui";
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
        description="แก้ชื่อ คำอธิบาย จุดเด่น รูป และผูกห้อง Telegram ของแต่ละตัว ขึ้นบนหน้าเว็บทันที"
      />
      <div className="space-y-8">
        <StatRow items={[
          { label: "อินดิเคเตอร์", value: indicators.length },
          { label: "ยังไม่มีรูป", value: missingImage, hint: missingImage ? <Status tone="warn">ควรใส่รูป</Status> : "ครบแล้ว" },
          { label: "ยังไม่ผูกห้อง", value: missingRoom, hint: missingRoom ? <Status tone="bad">ลูกค้าเข้าห้องไม่ได้</Status> : "ครบแล้ว" },
        ]} />

        <Section title="อินดิเคเตอร์ทั้งหมด" description="กดแถวเพื่อแก้ไข" bare>
          <ul className="space-y-3">
            {indicators.map((i) => {
              const noRoom = !i.is_reference && !room(i.code);
              return (
                <li key={i.code} className={cx(CARD, "overflow-visible")}>
                  <details className="group">
                    <summary className="flex min-h-20 cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-3 transition-colors hover:bg-panel-2/60 sm:px-6 group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
                      <span className="surface-dark relative grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-ink">
                        {i.image_url
                          // eslint-disable-next-line @next/next/no-img-element -- admin-provided poster
                          ? <img src={i.image_url} alt="" className="size-full object-cover" />
                          : <span className="num text-sm font-black text-white/40">{i.code}</span>}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{i.name} <span className="num ml-1 rounded-md border border-line bg-panel-2 px-1.5 py-0.5 text-xs font-bold text-muted">{i.code}</span></span>
                        <span className="block text-sm text-muted">{i.family} · {i.modes.join(" / ") || "ข้อมูลอ้างอิง"}</span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        {i.is_reference ? <Status>อ้างอิง</Status> : noRoom ? <Status tone="bad">ยังไม่ผูกห้อง</Status> : <Status tone="good">ผูกห้องแล้ว</Status>}
                        {!i.image_url && <Status tone="warn">ยังไม่มีรูป</Status>}
                      </span>
                      <span className="inline-flex min-h-10 items-center gap-1 rounded-full border border-line-strong px-4 text-sm font-medium group-open:border-fg">
                        <span className="group-open:hidden">แก้ไข</span><span className="hidden group-open:inline">ปิด</span>
                        <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
                      </span>
                    </summary>
                    <div className="rounded-b-2xl border-t border-line bg-panel-2 p-4 sm:p-6"><IndicatorForm indicator={i} room={room(i.code)} script={script(i.code)} /></div>
                  </details>
                </li>
              );
            })}
          </ul>
        </Section>
      </div>
    </>
  );
}
