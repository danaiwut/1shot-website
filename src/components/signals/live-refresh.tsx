"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play } from "lucide-react";
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
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-line bg-panel p-1 pl-3.5 text-sm shadow-[0_10px_30px_-24px_rgb(0_0_0/0.5)]">
      <span aria-hidden className={`size-2 rounded-full ${live ? "bg-buy animate-pulse-dot" : "bg-faint"}`} />
      <span role="status" className="mr-1.5 ml-1 min-w-0 truncate font-semibold">{paused ? "หยุดอัปเดตชั่วคราว" : live ? "อัปเดตสด" : "กำลังเชื่อมต่อ…"}</span>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-panel-3 px-3.5 text-sm font-medium whitespace-nowrap text-muted transition-colors hover:bg-fg hover:text-ink"
      >
        {paused ? <Play aria-hidden className="size-3.5" /> : <Pause aria-hidden className="size-3.5" />}
        {paused ? "อัปเดตต่อ" : "หยุดอัปเดต"}
      </button>
    </span>
  );
}
