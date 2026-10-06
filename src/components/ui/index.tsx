import Image from "next/image";
import Link from "next/link";
import { cloneElement, isValidElement, useId, type ComponentProps, type ReactElement, type ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
/** Full width unless the caller sets its own base width (no tailwind-merge, so w-full would otherwise win). */
const fullUnless = (className?: string) => !/(^|\s)w-/.test(className ?? "") && "w-full";
export { cx };

type Variant = "brand" | "ghost" | "outline" | "danger";
const variants: Record<Variant, string> = {
  brand: "bg-brand text-white hover:bg-brand-strong shadow-sm",
  ghost: "text-fg hover:bg-panel-3",
  outline: "border border-line-strong text-fg hover:border-fg",
  danger: "border border-sell/40 text-sell hover:bg-sell-dim",
};
const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 h-11 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

export function Button({ variant = "brand", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "brand", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(base, variants[variant], className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-card border border-line bg-panel shadow-[0_1px_2px_rgb(0_0_0/0.04)]", className)} {...props} />;
}

export function CardHeader({ title, action, hint }: { title: ReactNode; action?: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = "neutral" | "brand" | "buy" | "sell" | "info";
const tones: Record<Tone, string> = {
  neutral: "bg-panel-3 text-muted border-line",
  brand: "bg-brand-dim text-accent border-brand/25",
  buy: "bg-buy-dim text-buy border-buy/25",
  sell: "bg-sell-dim text-sell border-sell/25",
  info: "bg-info-dim text-info border-info/25",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return <span className={cx("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium leading-5", tones[tone], className)} {...props} />;
}

/** Wraps one control in its label; the hint or error is tied to it with aria-describedby (WCAG 1.3.1 / 3.3.1). */
export function Field({ label, hint, error, required, children }: { label: string; hint?: ReactNode; error?: string; required?: boolean; children: ReactNode }) {
  const id = useId();
  const note = error ?? hint;
  const control = isValidElement(children) && note
    ? cloneElement(children as ReactElement<Record<string, unknown>>, { "aria-describedby": `${id}-note`, ...(error && { "aria-invalid": true }) })
    : children;
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-fg/90">
        {label}
        {required && <><span aria-hidden className="ml-0.5 text-accent">*</span><span className="sr-only"> (จำเป็น)</span></>}
      </span>
      {control}
      {note && <span id={`${id}-note`} className={cx("block text-xs", error ? "text-sell" : "text-muted")}>{note}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cx(
        "h-11 rounded-lg border border-line-strong bg-panel px-3 text-sm text-fg placeholder:text-faint",
        fullUnless(className),
        "transition-colors focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/15 aria-invalid:border-sell",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cx("h-11 rounded-lg border border-line-strong bg-panel px-3 text-sm text-fg focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/15", fullUnless(className), className)}
      {...props}
    />
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const t = { info: "border-info/30 bg-info-dim text-info", error: "border-sell/30 bg-sell-dim text-sell", success: "border-buy/30 bg-buy-dim text-buy" }[tone];
  return <div role={tone === "error" ? "alert" : "status"} className={cx("rounded-lg border px-3.5 py-2.5 text-sm", t)}>{children}</div>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div aria-hidden className="size-10 rounded-full border border-dashed border-line-strong" />
      <p className="text-sm font-medium">{title}</p>
      {children && <div className="max-w-sm text-xs text-muted">{children}</div>}
    </div>
  );
}

/**
 * A filter link. The selected one is announced with aria-current and also differs in weight and
 * a check mark, not only in colour (WCAG 1.4.1 / 4.1.2).
 */
export function FilterLink({ on, className, children, ...props }: ComponentProps<typeof Link> & { on: boolean }) {
  return (
    <Link
      aria-current={on ? "true" : undefined}
      className={cx(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors",
        on ? "border-fg bg-fg font-semibold text-ink" : "border-line-strong bg-panel font-medium text-muted hover:border-fg hover:text-fg",
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
