import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { track } from "@/components/brand";

/*
 * Building blocks for every page behind login (member + admin), in the landing page's language:
 * rounded-2xl cards with a soft drop shadow, bold headings, pill tabs and pill statuses.
 *
 *   <Section title action>        heading row + one bordered box
 *   <StatRow items>               a few facts in one strip, separated by hairlines
 *   <Rows> / <Row>                divided list inside a Section
 *   <EmptyLine>                   one sentence (+ optional link) for empty content
 *   <Segmented label>             compact filter group for FilterLink items
 *   <SettingsSection>             titled card of form fields (account / admin forms)
 */

/** The card surface everything sits on. */
export const CARD = "overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_20px_60px_-40px_rgb(0_0_0/0.35)]";

export function Section({ title, description, action, children, id, className, bare = false }: {
  title: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; id?: string; className?: string;
  /** Render children without the bordered box (e.g. a table that brings its own). */
  bare?: boolean;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24", className)}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>
      {bare ? children : <div className={CARD}>{children}</div>}
    </section>
  );
}

export function StatRow({ items, className }: { items: { label: string; value: ReactNode; hint?: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-[0_20px_60px_-40px_rgb(0_0_0/0.35)] sm:grid-flow-col sm:auto-cols-fr", className)}>
      {items.map((i) => (
        <div key={i.label} className="relative bg-panel px-5 py-5">
          <dt className={cn("text-xs font-bold text-muted", track(i.label, "tracking-[0.14em]"))}>{i.label}</dt>
          <dd className="mt-2 text-2xl leading-none font-black tracking-tight tabular-nums sm:text-3xl">{i.value}</dd>
          {i.hint && <dd className="mt-2 text-sm text-muted">{i.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

export function Rows({ children, className, ...props }: ComponentProps<"ul">) {
  return <ul className={cn("divide-y divide-line", className)} {...props}>{children}</ul>;
}

export function Row({ children, className, ...props }: ComponentProps<"li">) {
  return <li className={cn("flex min-h-16 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-panel-2/60 sm:px-6", className)} {...props}>{children}</li>;
}

export function EmptyLine({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-8 text-sm text-muted sm:px-6">
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Segmented({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <nav aria-label={label} className={cn("inline-flex max-w-full flex-nowrap gap-1 overflow-x-auto rounded-full border border-line bg-panel p-1 shadow-[0_10px_30px_-24px_rgb(0_0_0/0.5)] [scrollbar-width:none]", className)}>
      {children}
    </nav>
  );
}

/** One titled card of form fields, full width (title + description inside the card). */
export function SettingsSection({ title, description, children, id, footer }: {
  title: ReactNode; description?: ReactNode; children: ReactNode; id?: string; footer?: ReactNode;
}) {
  return (
    <section id={id} className={cn(CARD, "scroll-mt-24 overflow-visible p-5 sm:p-6 [&+&]:mt-6")}>
      <div className="mb-5">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">{description}</p>}
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
  const pill = { neutral: "bg-panel-3 text-muted", good: "bg-buy-dim text-buy", warn: "bg-brand-dim text-accent", bad: "bg-sell-dim text-sell" }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", pill)}>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dot)} />{children}
    </span>
  );
}

/** Table header cell (always scope="col"). */
export function Th({ className, ...props }: ComponentProps<"th">) {
  return <th scope="col" className={cn("h-11 px-4 text-left align-middle text-xs font-bold tracking-[0.08em] whitespace-nowrap text-muted uppercase sm:px-6", className)} {...props} />;
}
export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-4 align-middle text-sm sm:px-6", className)} {...props} />;
}
/** Horizontally scrollable table wrapper; the page itself never scrolls sideways. */
export function TableBox({ children, minWidth = 640, caption }: { children: ReactNode; minWidth?: number; caption?: string }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-panel-2/60 [&_thead]:bg-panel-2" style={{ minWidth }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}
