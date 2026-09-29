import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export { cx };

type Variant = "brand" | "ghost" | "outline" | "danger";
const variants: Record<Variant, string> = {
  brand: "bg-brand text-white hover:bg-brand-strong shadow-[0_10px_30px_-10px_rgb(178_0_22/0.6)]",
  ghost: "text-fg hover:bg-panel-3",
  outline: "border border-line-strong text-fg hover:border-fg",
  danger: "border border-sell/40 text-sell hover:bg-sell-dim",
};
const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 h-10 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

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
  return <span className={cx("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-5", tones[tone], className)} {...props} />;
}

export function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-fg/90">{label}</span>
      {children}
      {error ? <span className="block text-xs text-sell">{error}</span> : hint && <span className="block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cx(
        "h-10 w-full rounded-lg border border-line-strong bg-ink/60 px-3 text-sm text-fg placeholder:text-faint",
        "transition-colors focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/15",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cx("h-10 w-full rounded-lg border border-line-strong bg-ink/60 px-3 text-sm text-fg focus:border-brand/70 focus:outline-none", className)}
      {...props}
    />
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const t = { info: "border-info/30 bg-info-dim text-info", error: "border-sell/30 bg-sell-dim text-sell", success: "border-buy/30 bg-buy-dim text-buy" }[tone];
  return <div className={cx("rounded-lg border px-3.5 py-2.5 text-sm", t)}>{children}</div>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="size-10 rounded-full border border-dashed border-line-strong" />
      <p className="text-sm font-medium">{title}</p>
      {children && <div className="max-w-sm text-xs text-muted">{children}</div>}
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--color-brand)" />
        <path d="M8 21.5 13 16.5l3.5 3.5L24 12" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="12" r="2.2" fill="#fff" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-bold tracking-tight">1SHOT</span>
        <span className="mt-1 text-[9px] font-medium tracking-[0.22em] text-muted uppercase">Signals</span>
      </span>
    </span>
  );
}
