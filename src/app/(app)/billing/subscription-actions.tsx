"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { cancelSubscription, openBillingPortal } from "@/lib/store/actions";

export function SubscriptionToggle({ id, cancelAtPeriodEnd, endsOn }: { id: string; cancelAtPeriodEnd: boolean; endsOn: string }) {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();
  const run = (cancel: boolean) => start(async () => {
    setError(undefined);
    const r = await cancelSubscription(id, cancel);
    if (r.error) setError(r.error);
  });
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      {cancelAtPeriodEnd ? (
        <Button variant="outline" className="h-9 px-3 text-xs" disabled={busy} onClick={() => run(false)}>ต่ออายุอัตโนมัติอีกครั้ง</Button>
      ) : (
        <Button
          variant="danger"
          className="h-9 px-3 text-xs"
          disabled={busy}
          onClick={() => confirm(`ยกเลิกการต่ออายุ? ยังใช้งานได้ถึง ${endsOn}`) && run(true)}
        >
          ยกเลิกการต่ออายุ
        </Button>
      )}
      {error && <span className="text-[11px] text-sell">{error}</span>}
    </div>
  );
}

export function PortalButton() {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <span className="flex flex-col items-end gap-1">
      <Button variant="outline" disabled={busy} onClick={() => start(async () => { const r = await openBillingPortal(); if (r?.error) setError(r.error); })}>
        จัดการบัตรและใบแจ้งหนี้
      </Button>
      {error && <span className="max-w-56 text-right text-[11px] text-sell">{error}</span>}
    </span>
  );
}
