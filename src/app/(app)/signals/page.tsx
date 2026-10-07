import { EmptyLine, Section, Segmented, TextLink } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { LiveRefresh } from "@/components/signals/live-refresh";
import { SetupRow } from "@/components/signals/setup-row";
import { ButtonLink, FilterLink } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import type { Indicator, Setup } from "@/lib/types";

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
  const filtered = Boolean(code || side || statusId !== "all");

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(code && { code }), ...(side && { side }), status: statusId, ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/signals?${p}`;
  };

  const summary = setups.length
    ? `แสดง ${setups.length} จาก ${total} รายการ${openShown ? ` · เปิดอยู่ ${openShown}` : ""}`
    : undefined;

  return (
    <>
      <PageHeader title="สัญญาณ" description="Setup จากอินดิเคเตอร์ที่คุณมีสิทธิ์ เรียงตามการอัปเดตล่าสุด" action={<LiveRefresh />} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented label="กรองตามสถานะ">
          {STATUS_FILTERS.map((f) => <FilterLink key={f.id} href={href({ status: f.id, page: "" })} on={f.id === statusId}>{f.label}</FilterLink>)}
        </Segmented>
        <Segmented label="กรองตามฝั่ง">
          {SIDES.map((s) => <FilterLink key={s.label} href={href({ side: s.v, page: "" })} on={side === s.v} className={s.v ? "num" : undefined}>{s.label}</FilterLink>)}
        </Segmented>
        {inds.length > 0 && (
          <Segmented label="กรองตามอินดิเคเตอร์" className="flex w-full flex-nowrap overflow-x-auto [scrollbar-width:none] sm:inline-flex sm:w-auto sm:flex-wrap">
            <FilterLink href={href({ code: "", page: "" })} on={!code}>ทุกอินดิเคเตอร์</FilterLink>
            {inds.map((i) => (
              <FilterLink key={i.code} href={href({ code: i.code, page: "" })} on={code === i.code} title={i.name} className="num">{i.code}</FilterLink>
            ))}
          </Segmented>
        )}
      </div>

      <Section title="รายการ Setup" description={summary}>
        {setups.length ? (
          <ul aria-label={`สัญญาณ ${setups.length} จาก ${total} รายการ`} className="divide-y divide-line">
            {setups.map((s) => <li key={s.setup_key}><SetupRow s={s} /></li>)}
          </ul>
        ) : filtered ? (
          <EmptyLine action={<TextLink href="/signals">ล้างตัวกรอง</TextLink>}>ไม่พบสัญญาณตามตัวกรองนี้</EmptyLine>
        ) : (
          <EmptyLine>ยังไม่มีสัญญาณ · Setup ใหม่จะแสดงที่นี่ทันทีที่อินดิเคเตอร์ส่งมา</EmptyLine>
        )}

        {total > setups.length && (
          <div className="flex justify-center border-t border-line px-4 py-4">
            <ButtonLink href={href({ page: String(page + 1) })} scroll={false} variant="outline">
              โหลดเพิ่ม <span className="num tabular-nums text-muted">({setups.length}/{total})</span>
            </ButtonLink>
          </div>
        )}
      </Section>
    </>
  );
}

