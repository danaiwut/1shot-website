"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { MotionConfig } from "motion/react";
import { cx } from "@/components/ui";

/*
 * Site-wide motion switch (WCAG 2.2.2 Pause/Stop, 2.3.3 Animation from Interactions).
 * "off" is remembered per browser and also follows the OS "reduce motion" setting.
 * The pre-paint script in the root layout applies it before first render, so nothing flashes.
 */
import { MOTION_KEY as KEY } from "@/lib/prefs";

const Ctx = createContext<{ off: boolean; toggle: () => void }>({ off: false, toggle: () => undefined });

export function MotionPrefProvider({ children }: { children: React.ReactNode }) {
  const [off, setOff] = useState(false);
  useEffect(() => setOff(document.documentElement.dataset.motion === "off"), []);
  const toggle = useCallback(() => {
    setOff((v) => {
      const next = !v;
      document.documentElement.dataset.motion = next ? "off" : "on";
      try { localStorage.setItem(KEY, next ? "off" : "on"); } catch { /* private mode */ }
      return next;
    });
  }, []);
  return (
    <Ctx.Provider value={{ off, toggle }}>
      <MotionConfig reducedMotion={off ? "always" : "user"}>{children}</MotionConfig>
    </Ctx.Provider>
  );
}

export const useMotionOff = () => useContext(Ctx).off;

/** Pause / resume every animation on the site. */
export function MotionToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { off, toggle } = useContext(Ctx);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={off}
      className={cx(
        "inline-flex min-h-11 items-center gap-2 rounded-lg border border-line-strong px-3 text-sm font-medium text-fg transition-colors hover:border-fg",
        className,
      )}
    >
      {off ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
      <span className={compact ? "sr-only" : undefined}>{off ? "เปิดภาพเคลื่อนไหว" : "หยุดภาพเคลื่อนไหว"}</span>
    </button>
  );
}
