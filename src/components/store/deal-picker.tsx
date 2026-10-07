"use client";
import { Check } from "lucide-react";
import { cx } from "@/components/ui";

type Props = {
  pool: { code: string; name: string }[];
  count: number;
  chosen: string[];
  onChange: (codes: string[]) => void;
  /** Codes the viewer already has for life — can't be chosen again. */
  owned?: string[];
  dark?: boolean;
};

/** Choose `count` indicators from a promotion's pool. Submits as repeated `codes` fields. */
export function DealPicker({ pool, count, chosen, onChange, owned = [], dark = false }: Props) {
  const full = chosen.length >= count;
  const toggle = (code: string) =>
    onChange(chosen.includes(code) ? chosen.filter((c) => c !== code) : count === 1 ? [code] : full ? chosen : [...chosen, code]);

  return (
    <fieldset>
      <legend className="mb-2 flex w-full items-baseline justify-between gap-3 text-sm font-medium">
        <span>เลือก {count} ตัว</span>
        <span className={cx("num text-xs", full ? "text-buy" : "text-muted")} aria-live="polite">เลือกแล้ว {chosen.length}/{count}</span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {pool.map(({ code, name }) => {
          const on = chosen.includes(code);
          const has = owned.includes(code);
          const blocked = has || (!on && full && count > 1);
          return (
            <label
              key={code}
              className={cx(
                "flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                on ? "border-brand bg-brand-dim" : dark ? "border-white/15" : "border-line",
                blocked ? "cursor-not-allowed opacity-55" : "cursor-pointer hover:border-line-strong",
              )}
            >
              <input
                type={count === 1 ? "radio" : "checkbox"}
                name="codes"
                value={code}
                checked={on}
                disabled={blocked}
                onChange={() => toggle(code)}
                className="sr-only"
              />
              <span className={cx("grid size-5 shrink-0 place-items-center rounded-md border-2", on ? "border-brand bg-brand text-white" : "border-line-strong")}>
                {on && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{name}</span>
                <span className="num block text-xs text-muted">{code}{has && " · มีแล้วตลอดชีพ"}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Sum of the chosen codes' single prices — the honest "normal price" for a pick. */
export function pickCompare(parts: Record<string, number>, chosen: string[], amount: number) {
  if (!chosen.length || chosen.some((c) => !(c in parts))) return null;
  const sum = chosen.reduce((t, c) => t + parts[c], 0);
  return sum > amount ? sum : null;
}
