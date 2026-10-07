import type { ReactNode } from "react";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Member-area content card in the shadcn dashboard style: a bordered header (real <h2> for heading order,
 * optional description and right-aligned action) above flush content.
 */
export function Section({ title, description, action, children, className, id, headingId }: {
  title: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; id?: string; headingId?: string;
}) {
  return (
    <Card id={id} className={cn("gap-0 overflow-hidden rounded-2xl py-0 shadow-xs", className)}>
      <CardHeader className="border-b border-line py-5">
        <CardTitle className="text-lg"><h2 id={headingId} className="leading-snug">{title}</h2></CardTitle>
        {description && <CardDescription className="text-muted">{description}</CardDescription>}
        {action && <CardAction className="flex flex-wrap items-center gap-2">{action}</CardAction>}
      </CardHeader>
      {children}
    </Card>
  );
}

/** Pill-group container for FilterLink rows. */
export function FilterGroup({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <nav aria-label={label} className={cn("inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-line bg-panel-2 p-1", className)}>
      {children}
    </nav>
  );
}
