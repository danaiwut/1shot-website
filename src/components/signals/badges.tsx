import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge, cx } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/format";
import type { SetupStatus } from "@/lib/types";

export function StatusBadge({ status, terminal, className }: { status: SetupStatus; terminal?: boolean; className?: string }) {
  const s = STATUS_LABEL[status] ?? STATUS_LABEL.info;
  const live = !terminal && (status === "pending" || status === "entry" || status === "retest");
  return (
    <Badge tone={s.tone} className={cx("font-semibold", className)}>
      {live && <span aria-hidden className="size-1.5 rounded-full bg-current animate-pulse-dot" />}
      {s.label}
    </Badge>
  );
}

/** BUY / SELL pill: colour + arrow + word (never colour alone). */
export function SideBadge({ side, size = "sm" }: { side: string | null; size?: "sm" | "lg" }) {
  if (side !== "BUY" && side !== "SELL") return <Badge>—</Badge>;
  const Icon = side === "BUY" ? ArrowUpRight : ArrowDownRight;
  return (
    <Badge tone={side === "BUY" ? "buy" : "sell"} className={cx("num font-bold tracking-wider", size === "lg" && "gap-1.5 px-3.5 py-1 text-sm [&>svg]:size-4")}>
      <Icon aria-hidden strokeWidth={2.5} />{side}
    </Badge>
  );
}

/** Text colour for a side (BUY green / SELL red / neutral). */
export const sideTone = (side: string | null) => (side === "BUY" ? "text-buy" : side === "SELL" ? "text-sell" : "text-muted");
