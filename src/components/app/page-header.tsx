import type { ReactNode } from "react";
import { Dot, Eyebrow } from "@/components/brand";

/** Page title block for every member/admin page: landing-style eyebrow + black title with the red dot, one line of context, at most one primary action. */
export function PageHeader({ title, description, action, eyebrow }: { title: ReactNode; description?: ReactNode; action?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}{!(typeof title === "string" && /[.…?!]$/.test(title)) && <Dot />}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted sm:text-base">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
