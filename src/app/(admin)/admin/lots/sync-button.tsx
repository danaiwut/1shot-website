"use client";
import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { Button, cx, Notice } from "@/components/ui";
import { syncNow, type SyncState } from "./actions";

export function SyncButton() {
  const [state, action, pending] = useActionState<SyncState, FormData>(syncNow, {});
  return (
    <form action={action} className="flex flex-col items-start gap-2 sm:items-end">
      <Button type="submit" disabled={pending} className="h-11 rounded-full px-5 font-semibold">
        <RefreshCw aria-hidden className={cx(pending && "animate-spin")} />{pending ? "กำลังดึงข้อมูล…" : "ดึงข้อมูลตอนนี้"}
      </Button>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
    </form>
  );
}
