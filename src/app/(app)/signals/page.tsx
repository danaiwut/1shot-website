import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { LiveRefresh } from "@/components/signals/live-refresh";
import { SetupRow } from "@/components/signals/setup-row";
import { Card, cx, Empty } from "@/components/ui";
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
      <PageHeader eyebrow="Signals" title="สัญญาณ" description="Setup จากอินดิเคเตอร์ที่คุณมีสิทธิ์ เรียงตามการอัปเดตล่าสุด" action={<LiveRefresh />} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmented items={STATUS_FILTERS.map((f) => ({ label: f.label, href: href({ status: f.id, page: "" }), on: f.id === statusId }))} />
        <Segmented items={[{ label: "ทุกฝั่ง", v: "" }, { label: "BUY", v: "BUY" }, { label: "SELL", v: "SELL" }].map((s) => ({ label: s.label, href: href({ side: s.v, page: "" }), on: side === s.v }))} />
      </div>
      <div className="-mx-4 mb-6 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip href={href({ code: "", page: "" })} on={!code}>ทั้งหมด</Chip>
        {(indicators as Pick<Indicator, "code" | "name">[] | null)?.map((i) => (
          <Chip key={i.code} href={href({ code: i.code, page: "" })} on={code === i.code} title={i.name}>{i.code}</Chip>
        ))}
      </div>

      <Card>
        {setups.length ? (
          <div className="divide-y divide-line">{setups.map((s) => <SetupRow key={s.setup_key} s={s} />)}</div>
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

function Segmented({ items }: { items: { label: string; href: string; on: boolean }[] }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-panel p-1">
      {items.map((i) => (
        <Link key={i.label} href={i.href} className={cx("rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", i.on ? "bg-brand text-white" : "text-muted hover:text-fg")}>
          {i.label}
        </Link>
      ))}
    </div>
  );
}

function Chip({ href, on, children, title }: { href: string; on: boolean; children: React.ReactNode; title?: string }) {
  return (
    <Link href={href} title={title} className={cx("num shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors", on ? "border-fg bg-fg text-ink" : "border-line bg-panel text-muted hover:border-line-strong hover:text-fg")}>
      {children}
    </Link>
  );
}
