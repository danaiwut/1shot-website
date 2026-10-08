"use client";
import type { ReactNode } from "react";
import { Check, type LucideIcon } from "lucide-react";
import { track } from "@/components/brand";
import { cx } from "@/components/ui";

/*
 * Pieces for back-office forms, the way /admin/products/new is built:
 *
 *   <FormLayout aside>     full-width main column + sticky right panel (preview, switches, save) from xl up
 *   <Step n title>         numbered card for one group of fields
 *   <ChoiceTiles>          2–4 big radio tiles instead of a <select>
 *   <PickTile>             checkbox / radio row with a name and a code (indicators, members…)
 *   <Switch>               on/off row that posts "on" like a checkbox
 *   <Panel title>          plain card for the right-hand panel
 *   <SubmitButton>         big pill button for the panel
 */

export const SHADOW = "shadow-[0_20px_60px_-40px_rgb(0_0_0/0.35)]";

export function FormLayout({ children, aside, className }: { children: ReactNode; aside?: ReactNode; className?: string }) {
  if (!aside) return <div className={cx("min-w-0 space-y-6", className)}>{children}</div>;
  return (
    <div className={cx("grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]", className)}>
      <div className="min-w-0 space-y-6">{children}</div>
      <aside className="space-y-4 xl:sticky xl:top-24">{aside}</aside>
    </div>
  );
}

export function Step({ n, title, hint, aside, children, className, id }: {
  n?: number; title: ReactNode; hint?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; id?: string;
}) {
  return (
    <section id={id} className={cx("scroll-mt-24 rounded-2xl border border-line bg-panel p-5 sm:p-6", SHADOW, className)}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {n !== undefined && <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">{n}</span>}
        <h2 className="flex-1 text-lg font-bold tracking-tight">{title}</h2>
        {aside}
      </div>
      {hint && <p className="-mt-2 mb-4 text-sm text-muted">{hint}</p>}
      {children}
    </section>
  );
}

export function Panel({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-2xl border border-line bg-panel p-5", SHADOW, className)}>
      {title && <p className={cx("mb-3 text-xs font-bold text-muted", track(title, "tracking-[0.14em]"))}>{title}</p>}
      {children}
    </div>
  );
}

export function ChoiceTiles<T extends string>({ name, value, onChange, options, label, columns }: {
  name: string; value: T; onChange: (v: T) => void; label: string;
  options: { value: T; title: ReactNode; line?: ReactNode; icon?: LucideIcon }[];
  columns?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("grid gap-3", columns ?? (options.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"))}>
      <input type="hidden" name={name} value={value} />
      {options.map((o) => {
        const on = value === o.value;
        return (
          <label key={o.value} className={cx(
            "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
            on ? "border-brand bg-brand-dim" : "border-line hover:border-line-strong",
          )}>
            <input type="radio" name={`${name}__choice`} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
            {o.icon && <span className={cx("grid size-10 shrink-0 place-items-center rounded-lg", on ? "bg-brand text-white" : "bg-panel-3 text-muted")}><o.icon aria-hidden className="size-5" /></span>}
            <span className="min-w-0"><span className="block font-bold">{o.title}</span>{o.line && <span className="block text-xs text-muted">{o.line}</span>}</span>
          </label>
        );
      })}
    </div>
  );
}

export function PickTile({ type = "checkbox", name, value, checked, onChange, title, code, line, disabled }: {
  type?: "checkbox" | "radio"; name: string; value: string; checked: boolean; onChange: () => void;
  title: ReactNode; code?: string; line?: ReactNode; disabled?: boolean;
}) {
  return (
    <label className={cx(
      "flex min-h-14 items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
      checked ? "border-brand bg-brand-dim" : "border-line hover:border-line-strong",
      disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
    )}>
      <input type={type} name={name} value={value} checked={checked} disabled={disabled} onChange={onChange} className="sr-only" />
      <span className={cx("grid size-5 shrink-0 place-items-center border-2", type === "radio" ? "rounded-full" : "rounded-[5px]", checked ? "border-brand bg-brand text-white" : "border-line-strong")}>
        {checked && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {line && <span className="block truncate text-xs text-muted">{line}</span>}
      </span>
      {code && <span className="num shrink-0 text-xs font-bold text-muted">{code}</span>}
    </label>
  );
}

/** On/off row; posts "on" when checked, like a checkbox. Controlled or uncontrolled. */
export function Switch({ name, label, hint, checked, defaultChecked, onChange }: {
  name: string; label: ReactNode; hint?: ReactNode; checked?: boolean; defaultChecked?: boolean; onChange?: (v: boolean) => void;
}) {
  return (
    <label className="group flex min-h-14 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-panel-3 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
      <input
        type="checkbox" role="switch" name={name} className="peer sr-only"
        {...(checked !== undefined ? { checked, onChange: (e) => onChange?.(e.target.checked) } : { defaultChecked, onChange: (e) => onChange?.(e.target.checked) })}
      />
      <span aria-hidden className="relative h-6 w-11 shrink-0 rounded-full bg-line-strong/50 transition-colors peer-checked:bg-brand after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

export function SubmitButton({ pending, disabled, children, pendingText = "กำลังบันทึก…", className }: { pending?: boolean; disabled?: boolean; children: ReactNode; pendingText?: string; className?: string }) {
  return (
    <button
      type="submit" disabled={pending || disabled}
      className={cx("inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-base font-semibold text-white shadow-[0_16px_40px_-16px_rgb(178_0_22/0.8)] transition-colors hover:bg-brand-strong disabled:opacity-60", className)}
    >
      {pending ? pendingText : children}
    </button>
  );
}
