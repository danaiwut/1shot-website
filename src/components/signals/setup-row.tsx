import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cx } from "@/components/ui";
import { fmtPrice, fmtRelative, rMultiple } from "@/lib/format";
import type { Setup } from "@/lib/types";
import { SideBadge, StatusBadge } from "./badges";

/**
 * One signal: side stripe, indicator code, entry / SL / TP in big tabular numbers, status and time.
 * Sized by its container, not the viewport, so it fits both full-width lists and narrow dashboard columns.
 */
export function SetupRow({ s }: { s: Setup }) {
  const r = rMultiple(s.entry, s.sl, s.tp);
  return (
    <Link
      href={`/signals/${encodeURIComponent(s.setup_key)}`}
      className="group @container relative block outline-none transition-colors hover:bg-panel-3/70 focus-visible:bg-panel-3/60 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
    >
      <span aria-hidden className={cx("absolute inset-y-3 left-0 w-1 rounded-r-full", s.side === "BUY" ? "bg-buy" : s.side === "SELL" ? "bg-sell" : "bg-line-strong", s.terminal && "opacity-40")} />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 py-4 pr-4 pl-5 sm:pr-5 sm:pl-6 @3xl:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_3.5rem_minmax(7rem,auto)_1rem] @3xl:gap-x-5">
        <div className="min-w-0">
          <p className="flex min-w-0 items-center gap-2">
            <SideBadge side={s.side} />
            <span className="num shrink-0 rounded-md bg-brand-dim px-1.5 py-0.5 text-xs font-bold text-accent">{s.code}</span>
            <span className="truncate font-semibold">{s.setup_name}</span>
          </p>
          <p className="num mt-1 truncate text-xs text-muted">
            {s.symbol.replace(/^.*:/, "")} · TF {s.timeframe} · {s.mode ?? "—"}
          </p>
        </div>

        <div className="col-span-2 row-start-2 grid grid-cols-3 gap-3 rounded-xl bg-panel-2 px-3.5 py-2.5 @3xl:contents">
          <Cell label="Entry" value={fmtPrice(s.entry)} />
          <Cell label="SL" value={fmtPrice(s.sl)} tone="text-sell" />
          <Cell label="TP" value={fmtPrice(s.tp)} tone="text-buy" />
          <div className="hidden @3xl:block"><Cell label="RR" value={r !== null ? `1:${r}` : "—"} tone="text-muted" /></div>
        </div>

        <div className="col-start-2 row-start-1 flex flex-col items-end gap-1 @3xl:col-auto @3xl:row-auto">
          <StatusBadge status={s.status} terminal={s.terminal} />
          <span className="num text-xs whitespace-nowrap text-muted">
            <span className="@3xl:hidden">{r !== null && `1:${r}R · `}</span>
            <time dateTime={s.updated_at}>{fmtRelative(s.updated_at)}</time>
          </span>
        </div>
        <ChevronRight aria-hidden className="hidden size-4 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent @3xl:block" />
      </div>
    </Link>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">{label}</p>
      <p className={cx("num truncate text-sm font-bold tabular-nums @md:text-base @3xl:text-lg", tone)}>{value}</p>
    </div>
  );
}
