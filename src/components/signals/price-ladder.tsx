import { fmtPrice, rMultiple } from "@/lib/format";

/** Vertical entry / stop / target ladder drawn to scale. */
export function PriceLadder({
  side, entry, sl, tp, exit, compact = false,
}: { side: string | null; entry: number | null; sl: number | null; tp: number | null; exit?: number | null; compact?: boolean }) {
  if (!entry || !sl || !tp) return <div className="text-xs text-muted">ไม่มีระดับราคา</div>;
  const hi = Math.max(entry, sl, tp, exit ?? entry);
  const lo = Math.min(entry, sl, tp, exit ?? entry);
  const span = hi - lo || 1;
  const H = compact ? 120 : 220;
  const pad = 14;
  const y = (p: number) => pad + ((hi - p) / span) * (H - pad * 2);
  const r = rMultiple(entry, sl, tp);
  const rows = [
    { label: "TP", price: tp, color: "var(--color-buy)" },
    { label: "Entry", price: entry, color: "var(--color-fg)" },
    { label: "SL", price: sl, color: "var(--color-sell)" },
  ];
  const buy = side === "BUY";

  return (
    <div className="flex items-stretch gap-4">
      <svg viewBox={`0 0 60 ${H}`} width={60} height={H} className="shrink-0" aria-hidden>
        <rect x="22" y={Math.min(y(tp), y(entry))} width="16" height={Math.abs(y(tp) - y(entry))} rx="3" fill="var(--color-buy-dim)" stroke="var(--color-buy)" strokeOpacity=".5" />
        <rect x="22" y={Math.min(y(sl), y(entry))} width="16" height={Math.abs(y(sl) - y(entry))} rx="3" fill="var(--color-sell-dim)" stroke="var(--color-sell)" strokeOpacity=".5" />
        <line x1="10" x2="50" y1={y(entry)} y2={y(entry)} stroke="var(--color-fg)" strokeWidth="2" />
        <path d={buy ? `M30 ${y(entry) - 10} l-5 7h10z` : `M30 ${y(entry) + 10} l-5 -7h10z`} fill="var(--color-fg)" />
        {exit != null && <circle cx="30" cy={y(exit)} r="4" fill="var(--color-fg)" stroke="var(--color-ink)" strokeWidth="2" />}
      </svg>
      <div className="relative flex-1" style={{ height: H }}>
        {rows.map((row) => (
          <div key={row.label} className="absolute inset-x-0 flex -translate-y-1/2 items-center gap-3" style={{ top: y(row.price) }}>
            <span className="w-12 text-xs font-bold tracking-wider uppercase" style={{ color: row.color }}>{row.label}</span>
            <span aria-hidden className="h-px flex-1 border-t border-dashed border-line-strong/50" />
            <span className={`num font-bold tabular-nums ${compact ? "text-sm" : "text-base sm:text-lg"}`}>{fmtPrice(row.price)}</span>
          </div>
        ))}
        {r !== null && !compact && (
          <div className="absolute right-0 bottom-0 translate-y-full pt-3 text-xs font-semibold text-muted">
            RR <span className="num ml-1 rounded-full bg-panel-3 px-2.5 py-0.5 text-sm text-fg">1 : {r}</span>
          </div>
        )}
      </div>
    </div>
  );
}
