import { Activity, ChevronDown, CircleCheck, Layers } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { LiveRefresh } from "@/components/signals/live-refresh";
import { SetupRow } from "@/components/signals/setup-row";
import { ButtonLink, Empty, FilterLink } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import type { Indicator, Setup } from "@/lib/types";
import { FilterGroup, Section } from "../_components/section";

export const metadata = { title: "สัญญาณ" };
const PAGE = 40;

const STATUS_FILTERS = [
  { id: "open", label: "เปิดอยู่", statuses: ["pending", "entry", "retest"] },
  { id: "closed", label: "ปิดแล้ว", statuses: ["tp", "sl", "close", "cancel", "expired"] },
  { id: "all", label: "ทั้งหมด", statuses: null },
] as const;

const SIDES = [{ label: "ทุกฝั่ง", v: "" }, { label: "BUY", v: "BUY" }, { label: "SELL", v: "SELL" }] as const;

export default async function SignalsPage({ searchParams }: PageProps<"/signals">) {
  const sp = await searchParams;
  const code = typeof sp.code === "string" ? sp.code : "";
  const side = sp.side === "BUY" || sp.side === "SELL" ? sp.side : "";
  const statusId = STATUS_FILTERS.find((f) => f.id === sp.status)?.id ?? "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const { supabase } = await requireViewer();

  let query = supabase.from("setups").select("*", { count: "exact" }).order("updated_at", { ascending: false }).range(0, page * PAGE - 1);
  if (code) query = query.eq("code", code);
  if (side) query = query.eq("side", side);
  const statuses = STATUS_FILTERS.find((f) => f.id === statusId)!.statuses;
  if (statuses) query = query.in("status", statuses as unknown as string[]).eq("terminal", statusId === "closed" ? true : false);

  const [{ data, count }, { data: indicators }] = await Promise.all([
    query,
    supabase.from("indicators").select("code,name").eq("is_reference", false).order("sort"),
  ]);
  const setups = (data ?? []) as Setup[];
  const total = count ?? setups.length;
  const openShown = setups.filter((s) => !s.terminal).length;
  const inds = (indicators ?? []) as Pick<Indicator, "code" | "name">[];
  const statusLabel = STATUS_FILTERS.find((f) => f.id === statusId)!.label;

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(code && { code }), ...(side && { side }), status: statusId, ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/signals?${p}`;
  };

  return (
    <>
      <PageHeader eyebrow="สัญญาณสด" title="สัญญาณ" description="Setup จากอินดิเคเตอร์ที่คุณมีสิทธิ์ เรียงตามการอัปเดตล่าสุด" action={<LiveRefresh />} />

      <section aria-label="สรุปสัญญาณตามตัวกรอง" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatCard icon={Layers} label="ตรงตัวกรอง" value={`${total}`} foot={`สถานะ: ${statusLabel}${side ? ` · ${side}` : ""}${code ? ` · ${code}` : ""}`} />
        <StatCard icon={Activity} label="ยังเปิดอยู่ (ที่แสดง)" value={`${openShown}`} foot="รอเข้า · เข้าแล้ว · รีเทสต์" />
        <StatCard icon={CircleCheck} label="ปิดแล้ว (ที่แสดง)" value={`${setups.length - openShown}`} foot="TP · SL · ปิด · ยกเลิก · หมดอายุ" />
      </section>

      <Section
        title="รายการ Setup"
        description={setups.length ? `แสดง ${setups.length} จาก ${total} รายการ` : "ไม่มีรายการตามตัวกรอง"}
      >
        <div className="flex flex-col gap-3 border-b border-line bg-panel-2/40 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <FilterGroup label="กรองตามสถานะ">
              {STATUS_FILTERS.map((f) => <FilterLink key={f.id} href={href({ status: f.id, page: "" })} on={f.id === statusId}>{f.label}</FilterLink>)}
            </FilterGroup>
            <FilterGroup label="กรองตามฝั่ง">
              {SIDES.map((s) => <FilterLink key={s.label} href={href({ side: s.v, page: "" })} on={side === s.v} className={s.v ? "num" : undefined}>{s.label}</FilterLink>)}
            </FilterGroup>
          </div>
          {inds.length > 0 && (
            <FilterGroup label="กรองตามอินดิเคเตอร์" className="flex w-full flex-nowrap overflow-x-auto [scrollbar-width:none] sm:inline-flex sm:w-auto sm:flex-wrap">
              <FilterLink href={href({ code: "", page: "" })} on={!code}>ทุกอินดิเคเตอร์</FilterLink>
              {inds.map((i) => (
                <FilterLink key={i.code} href={href({ code: i.code, page: "" })} on={code === i.code} title={i.name} className="num">{i.code}</FilterLink>
              ))}
            </FilterGroup>
          )}
        </div>

        {setups.length ? (
          <ul aria-label={`สัญญาณ ${setups.length} จาก ${total} รายการ`} className="divide-y divide-line">{setups.map((s) => <li key={s.setup_key}><SetupRow s={s} /></li>)}</ul>
        ) : (
          <Empty title="ไม่พบสัญญาณตามตัวกรอง">ลองเปลี่ยนตัวกรอง หรือรอ Setup ใหม่จากอินดิเคเตอร์</Empty>
        )}

        {total > setups.length && (
          <div className="flex justify-center border-t border-line px-4 py-4">
            <ButtonLink href={href({ page: String(page + 1) })} scroll={false} variant="outline">
              <ChevronDown aria-hidden className="size-4" /> โหลดเพิ่ม <span className="num text-muted">({setups.length}/{total})</span>
            </ButtonLink>
          </div>
        )}
      </Section>
    </>
  );
}
