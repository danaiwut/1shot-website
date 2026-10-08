import type * as React from "react";
import type { ReactNode } from "react";
import { ChevronDown, ShieldAlert, type LucideIcon } from "lucide-react";
import { cx } from "@/components/ui";

/*
 * The landing page's visual language, shared by the public site and the member area:
 * eyebrow + black headline with a red full stop, icon fact strips, FAQ accordions and chips.
 */

const THAI = /[\u0E00-\u0E7F]/;
/** Wide caps tracking only suits Latin; Thai letters fall apart with it. */
export const track = (text: unknown, wide = "tracking-[0.18em]") => (typeof text === "string" && THAI.test(text) ? "tracking-normal" : `${wide} uppercase`);

/** Small red label above a headline. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("text-sm font-bold text-accent", track(children), className)}>{children}</p>;
}

/** The red "." after a headline. */
export function Dot() {
  return <span className="text-brand dark:text-[#ff2e43]">.</span>;
}

/** Eyebrow (small red caps) + black headline ending in a red dot + one muted line. */
export function SectionHeading({ eyebrow, title, description, id, as: H = "h2", align = "left", size = "md", action, className }: {
  eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; id?: string; as?: "h1" | "h2"; align?: "left" | "center";
  size?: "sm" | "md" | "lg"; action?: ReactNode; className?: string;
}) {
  const center = align === "center";
  return (
    <div className={cx("flex flex-wrap items-end justify-between gap-4", center && "justify-center text-center", className)}>
      <div className={cx("min-w-0", center && "mx-auto max-w-2xl")}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <H id={id} className={cx(
          "font-black tracking-tight text-balance",
          Boolean(eyebrow) && (size === "sm" ? "mt-2" : "mt-3"),
          size === "sm" ? "text-2xl sm:text-3xl" : size === "lg" ? "text-4xl leading-[1.08] sm:text-5xl" : "text-3xl sm:text-4xl",
        )}>
          {title}<Dot />
        </H>
        {description && <p className={cx("mt-2 text-base text-muted", center ? "mx-auto max-w-xl" : "max-w-xl")}>{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/** Row of icon facts joined by hairlines (pricing hero / landing stats). */
export function FactStrip({ items, className }: { items: { icon: LucideIcon; t: ReactNode; d: ReactNode }[]; className?: string }) {
  return (
    <ul className={cx(
      "grid gap-px overflow-hidden rounded-2xl border border-line bg-line text-left shadow-[0_20px_60px_-40px_rgb(0_0_0/0.4)]",
      items.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "sm:grid-cols-3",
      className,
    )}>
      {items.map((f, i) => (
        <li key={i} className="flex items-center gap-3 bg-panel px-4 py-4">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white"><f.icon className="size-5" /></span>
          <span><span className="block text-sm font-semibold">{f.t}</span><span className="block text-xs text-muted">{f.d}</span></span>
        </li>
      ))}
    </ul>
  );
}

/** Question / answer accordion. */
export function FaqList({ items, className }: { items: readonly (readonly [string, ReactNode])[]; className?: string }) {
  return (
    <div className={cx("divide-y divide-line border-y border-line", className)}>
      {items.map(([q, a]) => (
        <details key={q} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold [&::-webkit-details-marker]:hidden">
            {q}
            <ChevronDown aria-hidden className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <p className="pb-5 text-sm leading-7 text-muted">{a}</p>
        </details>
      ))}
    </div>
  );
}

/** Outlined pill used for tags under posters. */
export function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-line-strong px-3 py-1.5 text-xs font-medium">{children}</span>;
}

/** Trading-risk footnote shown next to every buy box. */
export function RiskNote({ className }: { className?: string }) {
  return (
    <p className={cx("flex gap-2 text-xs leading-6 text-muted", className)}>
      <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />
      การเทรดมีความเสี่ยงสูง ผลในอดีตไม่ได้รับประกันผลในอนาคต · ชำระเป็นเงินบาทผ่าน Stripe · ขอสิทธิ์ใช้ฟรีผ่าน Exness IB ได้
    </p>
  );
}

/** Surface of every hero card, for blocks that build their own glow. */
export const HERO = "relative overflow-hidden rounded-3xl border border-line bg-ink text-fg shadow-[0_30px_80px_-40px_rgb(178_0_22/0.35)] dark:border-white/10 dark:shadow-[0_30px_80px_-40px_rgb(178_0_22/0.6)]";

/** Hero card with the landing's red glow — follows the theme (light: white + soft glow, dark: black + strong glow). */
export function DarkPanel({ as: Tag = "section", glow = "brand", className, children, ...props }: {
  as?: "header" | "section" | "article" | "div"; glow?: "brand" | "buy" | "none"; className?: string; children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  return (
    <Tag className={cx(HERO, className)} {...props}>
      {glow !== "none" && <div aria-hidden className={cx("pointer-events-none absolute -top-24 -right-16 size-96 rounded-full blur-[120px]", glow === "buy" ? "bg-buy/15 dark:bg-buy/30" : "bg-brand/15 dark:bg-brand/40")} />}
      {glow !== "none" && <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/4 size-72 rounded-full bg-brand/10 blur-[100px] dark:bg-brand/20" />}
      <div className="relative">{children}</div>
    </Tag>
  );
}
