import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Building blocks for every page behind login (member + admin). Quiet by design:
 * text and hairlines instead of stacked cards, one primary action per page, no decorative icons.
 *
 *   <Section title action>        heading row + one bordered box
 *   <StatRow items>               a few facts in one strip, separated by hairlines
 *   <Rows> / <Row>                divided list inside a Section
 *   <EmptyLine>                   one sentence (+ optional link) for empty content
 *   <Segmented label>             compact filter group for FilterLink items
 *   <SettingsSection>             label column + form column (account / admin forms)
 */

export function Section({ title, description, action, children, id, className, bare = false }: {
  title: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; id?: string; className?: string;
  /** Render children without the bordered box (e.g. a table that brings its own). */
  bare?: boolean;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      {bare ? children : <div className="overflow-hidden rounded-lg border border-line bg-panel">{children}</div>}
    </section>
  );
}

export function StatRow({ items, className }: { items: { label: string; value: ReactNode; hint?: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid overflow-hidden rounded-lg border border-line bg-panel sm:grid-flow-col sm:auto-cols-fr", className)}>
      {items.map((i, n) => (
        <div key={i.label} className={cn("px-4 py-3.5 sm:px-5", n > 0 && "border-t border-line sm:border-t-0 sm:border-l")}>
          <dt className="text-sm text-muted">{i.label}</dt>
          <dd className="num mt-1 text-xl font-semibold tabular-nums">{i.value}</dd>
          {i.hint && <dd className="mt-0.5 text-sm text-muted">{i.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

export function Rows({ children, className, ...props }: ComponentProps<"ul">) {
  return <ul className={cn("divide-y divide-line", className)} {...props}>{children}</ul>;
}

export function Row({ children, className, ...props }: ComponentProps<"li">) {
  return <li className={cn("flex min-h-14 items-center gap-3 px-4 py-3 sm:px-5", className)} {...props}>{children}</li>;
}

export function EmptyLine({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-6 text-sm text-muted sm:px-5">
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Segmented({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <nav aria-label={label} className={cn("inline-flex max-w-full flex-wrap gap-0.5 rounded-lg border border-line bg-panel-2 p-0.5", className)}>
      {children}
    </nav>
  );
}

export function SettingsSection({ title, description, children, id, footer }: {
  title: ReactNode; description?: ReactNode; children: ReactNode; id?: string; footer?: ReactNode;
}) {
  return (
    <section id={id} className="grid scroll-mt-24 gap-4 border-t border-line py-8 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-10">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="min-w-0 space-y-4">
        {children}
        {footer && <div className="flex flex-wrap items-center gap-3 pt-2">{footer}</div>}
      </div>
    </section>
  );
}

/** Inline text link with a 44px hit area. */
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return <Link className={cn("inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent underline-offset-4 hover:underline", className)} {...props} />;
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="-ml-1 mb-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 text-sm text-muted hover:text-fg">
      <ArrowLeft aria-hidden className="size-4" /> {children}
    </Link>
  );
}

/** Status shown as a coloured dot plus words (never colour alone). */
export function Status({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad"; children: ReactNode }) {
  const dot = { neutral: "bg-line-strong", good: "bg-buy", warn: "bg-brand", bad: "bg-sell" }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dot)} />{children}
    </span>
  );
}

/** Table header cell (always scope="col"). */
export function Th({ className, ...props }: ComponentProps<"th">) {
  return <th scope="col" className={cn("h-10 px-4 text-left align-middle text-xs font-medium whitespace-nowrap text-muted sm:px-5", className)} {...props} />;
}
export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle text-sm sm:px-5", className)} {...props} />;
}
/** Horizontally scrollable table wrapper; the page itself never scrolls sideways. */
export function TableBox({ children, minWidth = 640, caption }: { children: ReactNode; minWidth?: number; caption?: string }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}
