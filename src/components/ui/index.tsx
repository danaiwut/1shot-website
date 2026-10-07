import Image from "next/image";
import Link from "next/link";
import { cloneElement, isValidElement, useId, type ComponentProps, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button as UIButton, buttonVariants } from "./button";
import { Card as UICard } from "./card";
import { Input as UIInput } from "./input";

/*
 * App-wide primitives with a stable API, rendered with shadcn/ui (components/ui/*).
 * Colours come from the 1SHOT theme tokens, so dark-red / light-red both apply.
 */
const cx = (...c: (string | false | null | undefined)[]) => cn(...c);
export { cx };

type Variant = "brand" | "ghost" | "outline" | "danger";
const toShadcn = { brand: "default", ghost: "ghost", outline: "outline", danger: "destructive" } as const;

export function Button({ variant = "brand", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <UIButton variant={toShadcn[variant]} className={className} {...props} />;
}

export function ButtonLink({ variant = "brand", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(buttonVariants({ variant: toShadcn[variant] }), className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <UICard className={cn("gap-0 rounded-lg py-0 shadow-none", className)} {...props} />;
}

export function CardHeader({ title, action, hint }: { title: ReactNode; action?: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3.5 sm:px-5">
      <div className="min-w-0">
        <h2 className="text-base leading-snug font-semibold">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = "neutral" | "brand" | "buy" | "sell" | "info";
const tones: Record<Tone, string> = {
  neutral: "bg-panel-3 text-muted border-line",
  brand: "bg-brand-dim text-accent border-brand/30",
  buy: "bg-buy-dim text-buy border-buy/30",
  sell: "bg-sell-dim text-sell border-sell/30",
  info: "bg-info-dim text-info border-info/25",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span data-slot="badge" className={cn("inline-flex w-fit shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs leading-5 font-medium whitespace-nowrap [&>svg]:size-3", tones[tone], className)} {...props} />;
}

/** Wraps one control in its label; the hint or error is tied to it with aria-describedby (WCAG 1.3.1 / 3.3.1). */
export function Field({ label, hint, error, required, children }: { label: string; hint?: ReactNode; error?: string; required?: boolean; children: ReactNode }) {
  const id = useId();
  const note = error ?? hint;
  const control = isValidElement(children) && note
    ? cloneElement(children as ReactElement<Record<string, unknown>>, { "aria-describedby": `${id}-note`, ...(error && { "aria-invalid": true }) })
    : children;
  return (
    <label className="grid gap-2">
      <span className="text-sm leading-none font-medium">
        {label}
        {required && <><span aria-hidden className="ml-0.5 text-accent">*</span><span className="sr-only"> (จำเป็น)</span></>}
      </span>
      {control}
      {note && <span id={`${id}-note`} className={cn("block text-sm", error ? "text-sell" : "text-muted")}>{note}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <UIInput className={cn("text-sm placeholder:text-faint focus-visible:border-brand/70", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-lg border border-input bg-panel px-3 text-sm text-fg shadow-xs outline-none focus-visible:border-brand/70 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

const noticeIcon = {
  info: <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" strokeLinecap="round" /></svg>,
  error: <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" strokeLinecap="round" /></svg>,
  success: <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
};

/** shadcn-style alert. */
export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const t = { info: "border-line bg-panel text-fg", error: "border-sell/40 bg-sell-dim text-sell", success: "border-buy/40 bg-buy-dim text-buy" }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex w-full gap-2.5 rounded-lg border px-4 py-3 text-sm", t)}>
      {noticeIcon[tone]}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-4 py-8 text-sm sm:px-5">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 max-w-prose text-muted">{children}</div>}
    </div>
  );
}

/**
 * A filter link styled like a shadcn tab. The selected one is announced with aria-current and also differs in
 * weight and a check mark, not only in colour (WCAG 1.4.1 / 4.1.2).
 */
export function FilterLink({ on, className, children, ...props }: ComponentProps<typeof Link> & { on: boolean }) {
  return (
    <Link
      aria-current={on ? "true" : undefined}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm transition-colors",
        on ? "bg-panel font-semibold text-fg ring-1 ring-line" : "font-medium text-muted hover:text-fg",
        className,
      )}
      {...props}
    >
      {on && <svg aria-hidden viewBox="0 0 12 12" className="size-3"><path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      {children}
    </Link>
  );
}

/**
 * JR monogram with the 1SHOT wordmark. tone="dark" (white R) for dark surfaces, "light" (black R) for light ones,
 * "auto" follows the visitor's theme.
 */
export function Logo({ className, tone = "dark", priority }: { className?: string; tone?: "dark" | "light" | "auto"; priority?: boolean }) {
  if (tone === "auto") {
    return (
      <>
        <Logo tone="dark" priority={priority} className={cx("logo-for-dark", className)} />
        <Logo tone="light" priority={priority} className={cx("logo-for-light", className)} />
      </>
    );
  }
  return (
    <Image
      src={tone === "light" ? "/brand/logo-dark.png" : "/brand/logo.png"}
      alt="1SHOT"
      width={988}
      height={342}
      priority={priority}
      className={cx("h-9 w-auto select-none", className)}
      draggable={false}
    />
  );
}
