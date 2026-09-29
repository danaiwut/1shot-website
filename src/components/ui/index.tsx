import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
export { cx };

type Variant = "gold" | "ghost" | "outline" | "danger";
const variants: Record<Variant, string> = {
  gold: "bg-gold text-ink hover:bg-gold-strong shadow-[0_0_0_1px_rgb(243_205_121/0.4),0_8px_30px_-8px_rgb(226_182_91/0.5)]",
  ghost: "text-fg hover:bg-panel-3",
  outline: "border border-line-strong text-fg hover:border-gold/60 hover:text-gold-strong",
  danger: "border border-sell/40 text-sell hover:bg-sell-dim",
};
const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 h-10 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

export function Button({ variant = "gold", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "gold", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(base, variants[variant], className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-card border border-line bg-panel", className)} {...props} />;
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

type Tone = "neutral" | "gold" | "buy" | "sell" | "info";
const tones: Record<Tone, string> = {
  neutral: "bg-panel-3 text-muted border-line",
  gold: "bg-gold-dim text-gold border-gold/25",
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
        "transition-colors focus:border-gold/70 focus:outline-none focus:ring-2 focus:ring-gold/15",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cx("h-10 w-full rounded-lg border border-line-strong bg-ink/60 px-3 text-sm text-fg focus:border-gold/70 focus:outline-none", className)}
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
    <span className={cx("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#f7dc9a" />
            <stop offset="1" stopColor="#b8862f" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="none" stroke="url(#lg)" strokeWidth="1.5" />
        <path d="M7 15.5 10.5 12l2.5 2.5L17.5 8" fill="none" stroke="url(#lg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="17.5" cy="8" r="1.6" fill="#f3cd79" />
      </svg>
      <span>
        1SHOT<span className="text-gold"> ·</span> <span className="font-normal text-muted">Signals</span>
      </span>
    </span>
  );
}
