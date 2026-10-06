import { Badge } from "@/components/ui";
import { STATUS_LABEL } from "@/lib/format";
import type { SetupStatus } from "@/lib/types";

export function StatusBadge({ status, terminal }: { status: SetupStatus; terminal?: boolean }) {
  const s = STATUS_LABEL[status] ?? STATUS_LABEL.info;
  const live = !terminal && (status === "pending" || status === "entry" || status === "retest");
  return (
    <Badge tone={s.tone}>
      {live && <span aria-hidden className="size-1.5 rounded-full bg-current animate-pulse-dot" />}
      {s.label}
    </Badge>
  );
}

export function SideBadge({ side }: { side: string | null }) {
  if (side !== "BUY" && side !== "SELL") return <Badge>—</Badge>;
  return <Badge tone={side === "BUY" ? "buy" : "sell"} className="num tracking-wider">{side}</Badge>;
}
