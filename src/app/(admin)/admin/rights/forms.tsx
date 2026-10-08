"use client";
import { useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui";
import { markGrantSynced, markTvSynced } from "./actions";

/** `userId` for a member's right, `username` for a grant to someone without an account. */
export function TvDoneButton({ userId, username, code, label }: { userId?: string; username?: string; code: string; label: string }) {
  const [busy, start] = useTransition();
  return (
    <Button type="button" variant="outline" disabled={busy} aria-label={`ทำเครื่องหมายว่าเปิด ${label} ใน TradingView แล้ว`} onClick={() => start(() => (userId ? markTvSynced(userId, code) : markGrantSynced(username!, code)))}>
      <Check aria-hidden className="size-4" /> {busy ? "กำลังบันทึก…" : "เปิดแล้ว"}
    </Button>
  );
}

export function CopyName({ name }: { name: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(name).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 font-mono text-sm hover:text-accent"
      aria-label={`คัดลอกชื่อ TradingView ${name}`}
    >
      {name} {done ? <Check aria-hidden className="size-3.5 text-buy" /> : <Copy aria-hidden className="size-3.5 text-muted" />}
      <span aria-live="polite" className="sr-only">{done ? "คัดลอกแล้ว" : ""}</span>
    </button>
  );
}
