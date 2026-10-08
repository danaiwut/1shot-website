import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Button, Input } from "@/components/ui";

/*
 * Filter row for admin list pages (orders, support, lots, logs): pill tabs left, search right, one line from lg up.
 * Plain GET form, so the filter/search lives in the URL.
 */

/** "/admin/x?a=1&q=y" without empty params. */
export function qs(base: string, params: Record<string, string | undefined>) {
  const p = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
  const s = p.toString();
  return s ? `${base}?${s}` : base;
}

/** Lower-cased "needle in any of these" test for `?q=`. */
export const matches = (q: string, ...hay: (string | null | undefined)[]) => !q || hay.some((h) => h?.toLowerCase().includes(q.toLowerCase()));

export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

/** Obvious per-row action (link or button). */
export const ROW_ACTION = "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-line bg-panel px-4 text-sm font-semibold whitespace-nowrap transition-colors hover:border-brand/50 hover:text-accent";

export function Toolbar({ children, q, placeholder, keep }: {
  children?: ReactNode; q?: string; placeholder?: string; keep?: Record<string, string | undefined>;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line bg-panel px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="-mx-1 min-w-0 overflow-x-auto px-1 py-0.5 [&>nav]:max-w-none [&>nav]:flex-nowrap">{children}</div>
      {placeholder && (
        <form role="search" className="flex w-full gap-2 lg:w-auto lg:min-w-88">
          {Object.entries(keep ?? {}).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
          <div className="relative flex-1">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
            <Input type="search" name="q" defaultValue={q} placeholder={placeholder} aria-label={placeholder} className="h-10 rounded-full pl-10" />
          </div>
          <Button type="submit" variant="outline" className="h-10 rounded-full px-5">ค้นหา</Button>
        </form>
      )}
    </div>
  );
}

/** Friendly empty state inside a card: icon, one line, optional hint and action. */
export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <span aria-hidden className="grid size-12 place-items-center rounded-2xl bg-panel-3 text-muted [&>svg]:size-6">{icon}</span>}
      <p className="font-bold">{title}</p>
      {children && <p className="max-w-md text-sm text-muted">{children}</p>}
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
