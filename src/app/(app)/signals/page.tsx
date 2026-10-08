import { Radio, SearchX } from "lucide-react";
import { CARD, Segmented } from "@/components/app/kit";
import { EmptyState } from "@/components/app/toolbar";
import { DarkPanel, Dot } from "@/components/brand";
import { LiveRefresh } from "@/components/signals/live-refresh";
import { SetupRow } from "@/components/signals/setup-row";
import { ButtonLink, cx, FilterLink } from "@/components/ui";
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
  const buyShown = setups.filter((s) => s.side === "BUY").length;
  const sellShown = setups.filter((s) => s.side === "SELL").length;
  const inds = (indicators ?? []) as Pick<Indicator, "code" | "name">[];
  const filtered = Boolean(code || side || statusId !== "all");

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(code && { code }), ...(side && { side }), status: statusId, ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/signals?${p}`;
  };

  const stats = [
    { k: filtered ? "ตามตัวกรอง" : "ทั้งหมด", v: total },
    { k: total > setups.length ? "เปิดอยู่ (ที่แสดง)" : "เปิดอยู่", v: openShown },
    { k: "BUY / SELL", v: `${buyShown} / ${sellShown}` },
  ];

  return (
    <div className="space-y-8">
      <DarkPanel as="header" className="px-6 py-9 sm:px-10 sm:py-11">
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-[0.18em] text-accent uppercase">Live signals</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">สัญญาณ<Dot /></h1>
            <p className="mt-3 max-w-xl text-base text-muted">Setup จากอินดิเคเตอร์ที่คุณมีสิทธิ์ เรียงตามการอัปเดตล่าสุด กดแต่ละรายการเพื่อดูระดับราคาและไทม์ไลน์</p>
            <div className="mt-5"><LiveRefresh /></div>
          </div>
          <dl className="grid w-full grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:w-auto">
            {stats.map((x) => (
              <div key={x.k} className="bg-panel/80 px-4 py-3 backdrop-blur sm:px-5">
                <dt className="text-xs font-semibold text-muted">{x.k}</dt>
                <dd className="num mt-1 text-xl font-black tracking-tight tabular-nums sm:text-2xl">{x.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </DarkPanel>

      <div className="-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&>nav]:max-w-none [&>nav]:shrink-0">
        <Segmented label="กรองตามสถานะ">
          {STATUS_FILTERS.map((f) => <FilterLink key={f.id} href={href({ status: f.id, page: "" })} on={f.id === statusId}>{f.label}</FilterLink>)}
        </Segmented>
        <Segmented label="กรองตามฝั่ง">
          {SIDES.map((s) => (
            <FilterLink key={s.label} href={href({ side: s.v, page: "" })} on={side === s.v} className={cx(s.v && "num font-bold", s.v === "BUY" && side !== "BUY" && "text-buy", s.v === "SELL" && side !== "SELL" && "text-sell")}>{s.label}</FilterLink>
          ))}
        </Segmented>
        {inds.length > 0 && (
          <Segmented label="กรองตามอินดิเคเตอร์">
            <FilterLink href={href({ code: "", page: "" })} on={!code}>ทุกอินดิเคเตอร์</FilterLink>
            {inds.map((i) => (
              <FilterLink key={i.code} href={href({ code: i.code, page: "" })} on={code === i.code} title={i.name} className="num">{i.code}</FilterLink>
            ))}
          </Segmented>
        )}
      </div>

      <section aria-labelledby="setups-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <h2 id="setups-title" className="text-lg font-bold tracking-tight">รายการ Setup</h2>
          {setups.length > 0 && <p className="num text-sm text-muted">แสดง {setups.length} จาก {total} รายการ</p>}
        </div>
        <div className={CARD}>
          {setups.length ? (
            <ul aria-label={`สัญญาณ ${setups.length} จาก ${total} รายการ`} className="divide-y divide-line">
              {setups.map((s) => <li key={s.setup_key}><SetupRow s={s} /></li>)}
            </ul>
          ) : filtered ? (
            <EmptyState icon={<SearchX />} title="ไม่พบสัญญาณตามตัวกรองนี้" action={<ButtonLink href="/signals" variant="outline" className="rounded-full">ล้างตัวกรอง</ButtonLink>}>
              ลองเลือกสถานะ ฝั่ง หรืออินดิเคเตอร์อื่น
            </EmptyState>
          ) : (
            <EmptyState icon={<Radio />} title="ยังไม่มีสัญญาณ" action={<ButtonLink href="/store" className="rounded-full">เลือกอินดิเคเตอร์</ButtonLink>}>
              Setup ใหม่จะแสดงที่นี่ทันทีที่อินดิเคเตอร์ส่งมา ถ้ายังไม่มีสิทธิ์ เลือกอินดิเคเตอร์ได้ที่ร้านค้า
            </EmptyState>
          )}

          {total > setups.length && (
            <div className="flex justify-center border-t border-line px-4 py-5">
              <ButtonLink href={href({ page: String(page + 1) })} scroll={false} variant="outline" className="h-11 rounded-full px-6">
                โหลดเพิ่ม <span className="num tabular-nums text-muted">({setups.length}/{total})</span>
              </ButtonLink>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
