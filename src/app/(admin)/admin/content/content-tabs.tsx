import { Segmented } from "@/components/app/kit";
import { FilterLink } from "@/components/ui";

export const CONTENT_TABS = [
  { id: "brief", label: "สรุปเช้า", line: "สรุปภาวะตลาดทองคำประจำวัน ที่สมาชิกเห็นในหน้า “ข่าวและสรุปตลาด” และแดชบอร์ด" },
  { id: "news", label: "ข่าวโลก", line: "ข่าวที่สมาชิกเห็นในหน้า “ข่าวและสรุปตลาด”" },
  { id: "announcements", label: "ประกาศ", line: "ข่าวสารและคำแนะนำที่สมาชิกเห็นในเมนู ประกาศ" },
  { id: "blog", label: "บล็อก Facebook", line: "วางลิงก์โพสต์ Facebook แล้วจะขึ้นเป็นการ์ดเลื่อนบนหน้าแรก กดการ์ดแล้วไปที่โพสต์บน Facebook" },
] as const;
export type ContentTab = (typeof CONTENT_TABS)[number]["id"];
export const contentTab = (v: unknown) => CONTENT_TABS.find((t) => t.id === v) ?? CONTENT_TABS[0];

/** "เนื้อหา" is one place: morning brief, world news, announcements and the Facebook blog. */
export function ContentTabs({ on }: { on: ContentTab }) {
  return (
    <Segmented label="เนื้อหา" className="mb-8">
      {CONTENT_TABS.map((t) => <FilterLink key={t.id} href={`/admin/content?tab=${t.id}`} on={on === t.id}>{t.label}</FilterLink>)}
    </Segmented>
  );
}
