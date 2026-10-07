"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Re-renders the server page when a new signal event arrives (RLS still filters what is shown). */
export function LiveRefresh({ filter }: { filter?: string }) {
  const router = useRouter();
  const [live, setLive] = useState(false);
  // WCAG 2.2.2: auto-updating content needs a way to pause it.
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) { setLive(false); return; }
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel(`signals-${filter ?? "all"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "signal_events", ...(filter ? { filter } : {}) }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => router.refresh(), 400);
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [router, filter, paused]);
  return (
    <span className="inline-flex items-center gap-2.5 text-xs text-muted">
      <span aria-hidden className={`size-2 rounded-full ${live ? "bg-buy animate-pulse-dot" : "bg-faint"}`} />
      <span role="status" className="font-medium">{paused ? "หยุดอัปเดตชั่วคราว" : live ? "อัปเดตสด" : "กำลังเชื่อมต่อ…"}</span>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="inline-flex min-h-11 items-center rounded-xl border border-line-strong bg-panel px-3.5 text-sm font-medium shadow-xs text-fg outline-none hover:border-fg focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {paused ? "อัปเดตต่อ" : "หยุดอัปเดต"}
      </button>
    </span>
  );
}
