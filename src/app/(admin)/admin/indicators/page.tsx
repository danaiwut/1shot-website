import { PageHeader } from "@/components/app/page-header";
import { Badge, Card } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { loadIndicators } from "@/lib/indicators";
import { IndicatorForm } from "./indicator-form";

export const metadata = { title: "อินดิเคเตอร์และห้อง" };

export default async function IndicatorsAdminPage() {
  const { supabase } = await requireStaff();
  const [indicators, { data: rooms }] = await Promise.all([
    loadIndicators(supabase),
    supabase.from("indicators").select("code, telegram_room_id"),
  ]);
  const room = (code: string) => ((rooms ?? []) as { code: string; telegram_room_id: string | null }[]).find((r) => r.code === code)?.telegram_room_id ?? null;

  return (
    <>
      <PageHeader
        eyebrow="ผู้ดูแลระบบ"
        title="อินดิเคเตอร์และห้อง Telegram"
        description="แก้ชื่อ คำอธิบาย จุดเด่น และรูปที่แสดงบนหน้าเว็บ รวมถึงผูกห้อง Telegram ของแต่ละอินดิเคเตอร์ การเปลี่ยนแปลงขึ้นบนหน้าเว็บทันที"
      />
      <ul className="space-y-3">
        {indicators.map((i) => (
          <li key={i.code}>
            <Card className="overflow-hidden">
              <details>
                <summary className="flex min-h-16 cursor-pointer flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="num grid size-10 shrink-0 place-items-center rounded-lg bg-brand-dim text-sm font-bold text-accent">{i.code}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{i.name}</span>
                    <span className="block text-sm text-muted">{i.family} · {i.modes.join(" / ") || "ข้อมูลอ้างอิง"}</span>
                  </span>
                  {!i.image_url && <Badge>ยังไม่มีรูป</Badge>}
                  {!i.is_reference && !room(i.code) && <Badge tone="sell">ยังไม่ผูกห้อง</Badge>}
                </summary>
                <div className="border-t border-line p-4 sm:p-5"><IndicatorForm indicator={i} room={room(i.code)} /></div>
              </details>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
