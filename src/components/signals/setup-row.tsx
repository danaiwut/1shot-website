import Link from "next/link";
import { fmtPrice, fmtRelative, rMultiple } from "@/lib/format";
import type { Setup } from "@/lib/types";
import { SideBadge, StatusBadge } from "./badges";

export function SetupRow({ s }: { s: Setup }) {
  const r = rMultiple(s.entry, s.sl, s.tp);
  return (
    <Link
      href={`/signals/${encodeURIComponent(s.setup_key)}`}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-panel-2 md:grid-cols-[auto_1.4fr_repeat(3,0.8fr)_auto_auto]"
    >
      <span className="grid size-9 place-items-center rounded-lg border border-line bg-panel-2 text-[11px] font-semibold text-gold">{s.code}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{s.setup_name}</p>
        <p className="num truncate text-[11px] text-muted">
          {s.symbol} · {s.timeframe} · {s.mode ?? "—"} · {fmtRelative(s.updated_at)}
        </p>
      </div>
      <Cell label="Entry" value={fmtPrice(s.entry)} />
      <Cell label="SL" value={fmtPrice(s.sl)} tone="text-sell" />
      <Cell label="TP" value={fmtPrice(s.tp)} tone="text-buy" />
      <div className="hidden md:block"><SideBadge side={s.side} /></div>
      <div className="flex flex-col items-end gap-1">
        <StatusBadge status={s.status} terminal={s.terminal} />
        {r !== null && <span className="num text-[10px] text-faint">1:{r}R</span>}
      </div>
    </Link>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="hidden md:block">
      <p className="text-[10px] text-faint">{label}</p>
      <p className={`num text-sm ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
