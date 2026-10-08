"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { cancelSubscription, openBillingPortal } from "@/lib/store/actions";

const pill = "h-11 rounded-full px-5 font-semibold";

export function SubscriptionToggle({ id, cancelAtPeriodEnd, endsOn }: { id: string; cancelAtPeriodEnd: boolean; endsOn: string }) {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();
  const run = (cancel: boolean) => start(async () => {
    setError(undefined);
    const r = await cancelSubscription(id, cancel);
    if (r.error) setError(r.error);
  });
  return (
    <div className="flex w-full flex-col items-stretch gap-1.5">
      {cancelAtPeriodEnd ? (
        <Button variant="outline" disabled={busy} onClick={() => run(false)} className={pill}>{busy ? "กำลังบันทึก…" : "ต่ออายุอัตโนมัติอีกครั้ง"}</Button>
      ) : (
        <Button
          variant="outline"
          disabled={busy}
          className={`${pill} text-sell hover:border-sell/50 hover:text-sell`}
          onClick={() => confirm(`ยกเลิกการต่ออายุ? ยังใช้งานได้ถึง ${endsOn}`) && run(true)}
        >
          {busy ? "กำลังบันทึก…" : "ยกเลิกการต่ออายุ"}
        </Button>
      )}
      {error && <span role="alert" className="text-sm text-sell">{error}</span>}
    </div>
  );
}

export function PortalButton() {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <span className="flex flex-col items-start gap-1 sm:items-end">
      <Button variant="outline" disabled={busy} className={pill} onClick={() => start(async () => { const r = await openBillingPortal(); if (r?.error) setError(r.error); })}>
        {busy ? "กำลังเปิด…" : "จัดการบัตรและใบแจ้งหนี้"}
      </Button>
      {error && <span role="alert" className="max-w-64 text-sm text-sell sm:text-right">{error}</span>}
    </span>
  );
}
