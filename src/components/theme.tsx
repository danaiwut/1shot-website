"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cx } from "@/components/ui";

/*
 * Visitor-chosen theme: dark-red (default) or light-red.
 * Stored per browser; THEME_SCRIPT applies it before first paint so the page never flashes the wrong theme.
 */
import { THEME_KEY as KEY } from "@/lib/prefs";

export function ThemeToggle({ className, label = false }: { className?: string; label?: boolean }) {
  const [light, setLight] = useState(false);
  useEffect(() => setLight(document.documentElement.dataset.theme === "light"), []);
  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "dark";
    try { localStorage.setItem(KEY, next ? "light" : "dark"); } catch { /* private mode */ }
  };
  const text = light ? "เปลี่ยนเป็นธีมดำ-แดง" : "เปลี่ยนเป็นธีมขาว-แดง";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label ? undefined : text}
      title={text}
      className={cx(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-line-strong px-3 text-sm font-medium text-fg transition-colors hover:border-fg",
        className,
      )}
    >
      {light ? <Moon aria-hidden className="size-4" /> : <Sun aria-hidden className="size-4" />}
      {label && <span>{text}</span>}
    </button>
  );
}
