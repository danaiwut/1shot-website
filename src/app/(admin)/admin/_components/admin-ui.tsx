import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Card, CardAction, CardDescription, CardHeader } from "@/components/ui/card";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/*
 * Small presentational helpers shared by the back-office pages, built on shadcn/ui.
 * Colours only come from theme tokens, so dark-red and light-red both work.
 */

/** "Back to list" link above a detail page's header. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
      <ArrowLeft aria-hidden className="size-4" /> {children}
    </Link>
  );
}

/** shadcn Card with a bordered header (h2 title, description, right-side action). */
export function Panel({ title, description, action, children, className, id }: {
  title?: ReactNode; description?: ReactNode; action?: ReactNode; children?: ReactNode; className?: string; id?: string;
}) {
  return (
    <Card id={id} className={cn("min-w-0 gap-0 overflow-hidden rounded-2xl py-0 shadow-xs", className)}>
      {title && (
        <CardHeader className="border-b border-line py-5 [.border-b]:pb-5">
          <h2 data-slot="card-title" className="text-lg leading-snug font-semibold tracking-tight">{title}</h2>
          {description && <CardDescription className="text-sm text-muted">{description}</CardDescription>}
          {action && <CardAction className="flex flex-wrap items-center gap-2">{action}</CardAction>}
        </CardHeader>
      )}
      {children}
    </Card>
  );
}

/** Row above a table: filters on the left, search / extra controls on the right. */
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-3 border-b border-line bg-panel-2/40 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between", className)}>{children}</div>;
}

/** Segmented control made of FilterLinks. */
export function Segmented({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav aria-label={label} className="min-w-0">
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-panel-2 p-1">{children}</div>
    </nav>
  );
}

/** Column header with scope="col" and the admin table look. */
export function Th({ className, ...props }: ComponentProps<"th">) {
  return <TableHead scope="col" className={cn("h-11 px-3 text-xs font-medium text-muted first:pl-4 last:pr-4 sm:first:pl-6 sm:last:pr-6", className)} {...props} />;
}

/** Cell padding that lines up with Th. */
export const td = "px-3 py-3 first:pl-4 last:pr-4 sm:first:pl-6 sm:last:pr-6";

/** Header row background for tables. */
export const theadRow = "border-line bg-panel-2 hover:bg-panel-2";

/** Label / value row inside a <dl>. */
export function InfoRow({ k, children }: { k: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <dt className="text-sm text-muted">{k}</dt>
      <dd className="min-w-0 text-right text-sm">{children}</dd>
    </div>
  );
}

/** Text link styled as a quiet action in card headers. */
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return <Link className={cn("inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent underline-offset-4 hover:underline", className)} {...props} />;
}
