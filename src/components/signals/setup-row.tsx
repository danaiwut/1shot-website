import Link from "next/link";
import { fmtPrice, fmtRelative, rMultiple } from "@/lib/format";
import type { Setup } from "@/lib/types";
import { SideBadge, StatusBadge } from "./badges";

/** Sized by its container, not the viewport, so it fits both full-width lists and narrow dashboard columns. */
export function SetupRow({ s }: { s: Setup }) {
  const r = rMultiple(s.entry, s.sl, s.tp);
  return (
    <Link href={`/signals/${encodeURIComponent(s.setup_key)}`} className="@container block transition-colors hover:bg-panel-2">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2.5 px-4 py-3.5 sm:px-5 @2xl:grid-cols-[auto_minmax(0,1.4fr)_repeat(3,minmax(0,0.75fr))_3.5rem_6rem] @2xl:gap-x-4">
        <span className="num grid size-10 place-items-center rounded-xl bg-brand-dim text-[11px] font-bold text-accent">{s.code}</span>
        <div className="min-w-0">
          <p className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{s.setup_name}</span>
            <span className="@2xl:hidden"><SideBadge side={s.side} /></span>
          </p>
          <p className="num truncate text-[11px] text-muted">
            {s.symbol.replace(/^.*:/, "")} · {s.timeframe} · {s.mode ?? "—"} · {fmtRelative(s.updated_at)}
          </p>
        </div>

        <div className="col-span-3 grid grid-cols-3 gap-3 rounded-xl bg-panel-2 px-3 py-2 @2xl:contents">
          <Cell label="Entry" value={fmtPrice(s.entry)} />
          <Cell label="SL" value={fmtPrice(s.sl)} tone="text-sell" />
          <Cell label="TP" value={fmtPrice(s.tp)} tone="text-buy" />
          <div className="hidden @2xl:block"><SideBadge side={s.side} /></div>
        </div>

        <div className="col-start-3 row-start-1 flex flex-col items-end gap-1 @2xl:col-auto @2xl:row-auto">
          <StatusBadge status={s.status} terminal={s.terminal} />
          {r !== null && <span className="num text-[10px] text-faint">1:{r}R</span>}
        </div>
      </div>
    </Link>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-faint">{label}</p>
      <p className={`num truncate text-xs @2xl:text-sm ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
