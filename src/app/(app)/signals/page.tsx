import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { LiveRefresh } from "@/components/signals/live-refresh";
import { SetupRow } from "@/components/signals/setup-row";
import { Card, cx, Empty, FilterLink } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import type { Indicator, Setup } from "@/lib/types";

export const metadata = { title: "สัญญาณ" };
const PAGE = 40;

const STATUS_FILTERS = [
  { id: "open", label: "เปิดอยู่", statuses: ["pending", "entry", "retest"] },
  { id: "closed", label: "ปิดแล้ว", statuses: ["tp", "sl", "close", "cancel", "expired"] },
  { id: "all", label: "ทั้งหมด", statuses: null },
] as const;

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

  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(code && { code }), ...(side && { side }), status: statusId, ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/signals?${p}`;
  };

  return (
    <>
      <PageHeader eyebrow="สัญญาณสด" title="สัญญาณ" description="Setup จากอินดิเคเตอร์ที่คุณมีสิทธิ์ เรียงตามการอัปเดตล่าสุด" action={<LiveRefresh />} />

      <div className="mb-6 space-y-3 rounded-card border border-line bg-panel p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="สถานะ" items={STATUS_FILTERS.map((f) => ({ label: f.label, href: href({ status: f.id, page: "" }), on: f.id === statusId }))} />
          <Segmented label="ฝั่ง" items={[{ label: "ทุกฝั่ง", v: "" }, { label: "BUY", v: "BUY" }, { label: "SELL", v: "SELL" }].map((s) => ({ label: s.label, href: href({ side: s.v, page: "" }), on: side === s.v }))} />
        </div>
        <nav aria-label="กรองตามอินดิเคเตอร์" className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
          <FilterLink href={href({ code: "", page: "" })} on={!code}>ทุกอินดิเคเตอร์</FilterLink>
          {(indicators as Pick<Indicator, "code" | "name">[] | null)?.map((i) => (
            <FilterLink key={i.code} href={href({ code: i.code, page: "" })} on={code === i.code} title={i.name} className="num">{i.code}</FilterLink>
          ))}
        </nav>
      </div>

      <Card>
        {setups.length ? (
          <ul aria-label={`สัญญาณ ${setups.length} จาก ${count ?? setups.length} รายการ`} className="divide-y divide-line">{setups.map((s) => <li key={s.setup_key}><SetupRow s={s} /></li>)}</ul>
        ) : (
          <Empty title="ไม่พบสัญญาณตามตัวกรอง">ลองเปลี่ยนตัวกรอง หรือรอ Setup ใหม่จากอินดิเคเตอร์</Empty>
        )}
      </Card>
      {(count ?? 0) > setups.length && (
        <div className="mt-4 flex justify-center">
          <Link href={href({ page: String(page + 1) })} scroll={false} className="rounded-xl border border-line-strong bg-panel px-4 py-2 text-sm text-muted hover:text-fg">
            โหลดเพิ่ม ({setups.length}/{count})
          </Link>
        </div>
      )}
    </>
  );
}

function Segmented({ label, items }: { label: string; items: { label: string; href: string; on: boolean }[] }) {
  return (
    <nav aria-label={`กรองตาม${label}`} className="inline-flex items-center gap-1 rounded-xl border border-line bg-panel-2 p-1">
      <span aria-hidden className="px-2 text-xs text-muted">{label}</span>
      {items.map((i) => (
        <Link
          key={i.label}
          href={i.href}
          aria-current={i.on ? "true" : undefined}
          className={cx("rounded-lg px-3 py-1.5 text-xs transition-colors", i.on ? "bg-panel font-semibold text-fg shadow-[0_1px_3px_rgb(0_0_0/0.12)] ring-1 ring-line-strong" : "font-medium text-muted hover:text-fg")}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
