import type { ReactNode } from "react";

/** Page title block for every member/admin page: title, one line of context, at most one primary action. */
export function PageHeader({ title, description, action }: { title: ReactNode; description?: ReactNode; action?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
