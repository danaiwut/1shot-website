import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Flat KPI tile (prefer StatRow from ./kit for several facts in a row). */
export function StatCard({ label, value, badge, foot, tone = "default", className }: {
  label: string; value: ReactNode; icon?: LucideIcon; badge?: ReactNode; foot?: ReactNode; tone?: "default" | "alert"; className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-panel px-4 py-3.5 sm:px-5", tone === "alert" ? "border-brand/60" : "border-line", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted">{label}</p>
        {badge}
      </div>
      <p className="num mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {foot && <div className="mt-0.5 text-sm text-muted">{foot}</div>}
    </div>
  );
}
