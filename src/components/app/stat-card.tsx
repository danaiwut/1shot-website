import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** KPI tile in the shadcn dashboard style: label, big value, optional badge and a one-line footnote. */
export function StatCard({ label, value, icon: Icon, badge, foot, tone = "default", className }: {
  label: string; value: ReactNode; icon?: LucideIcon; badge?: ReactNode; foot?: ReactNode; tone?: "default" | "alert"; className?: string;
}) {
  return (
    <Card className={cn("gap-3 rounded-2xl bg-gradient-to-t from-brand-dim/40 to-panel py-4 shadow-xs sm:gap-4 sm:py-5", tone === "alert" && "border-brand/50", className)}>
      <CardHeader className="px-4 sm:px-5">
        <CardDescription className="flex items-center gap-2 text-sm text-muted">
          {Icon && <Icon aria-hidden className="size-4 text-accent" />}{label}
        </CardDescription>
        <CardTitle className="num text-2xl font-bold tabular-nums sm:text-3xl">{value}</CardTitle>
        {badge && <CardAction>{badge}</CardAction>}
      </CardHeader>
      {foot && <CardFooter className="px-4 text-sm text-muted sm:px-5">{foot}</CardFooter>}
    </Card>
  );
}
