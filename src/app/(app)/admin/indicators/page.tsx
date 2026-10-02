import { PageHeader } from "@/components/app/page-header";
import { Card, CardHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import type { Indicator } from "@/lib/types";
import { RoomForm } from "./room-form";

export const metadata = { title: "อินดิเคเตอร์และห้อง" };

export default async function IndicatorsAdminPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("indicators").select("*").order("sort");
  return (
    <>
      <PageHeader eyebrow="ผู้ดูแลระบบ" title="อินดิเคเตอร์และห้อง Telegram" description="ผูกห้อง Telegram กับอินดิเคเตอร์ สมาชิกที่มีสิทธิ์และผ่านการตรวจ IB จะขอลิงก์เข้าห้องได้ บอทต้องเป็นแอดมินในห้องนั้นและมีสิทธิ์เชิญสมาชิก" />
      <Card>
        <CardHeader title="รายการ" />
        <ul className="divide-y divide-line">
          {((data ?? []) as Indicator[]).map((ind) => (
            <li key={ind.code} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
              <div className="min-w-0 sm:min-w-56">
                <p className="text-sm font-medium"><span className="num mr-2 text-accent">{ind.code}</span>{ind.name}</p>
                <p className="text-xs text-muted">{ind.family} · {ind.modes.join(" / ") || "ข้อมูลอ้างอิง"}</p>
              </div>
              {ind.is_reference ? <span className="text-xs text-faint">ข้อมูลอ้างอิง สมาชิกทุกคนเห็น</span> : <RoomForm code={ind.code} room={ind.telegram_room_id} />}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
