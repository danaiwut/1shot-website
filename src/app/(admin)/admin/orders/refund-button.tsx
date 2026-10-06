"use client";
import { useState, useTransition } from "react";
import { Undo2 } from "lucide-react";
import { refund } from "./actions";

export function RefundButton({ orderId, label }: { orderId: string; label: string }) {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={busy}
        title="คืนเงินเต็มจำนวนและถอนสิทธิ์"
        aria-label={`คืนเงิน ${label}`}
        onClick={() => confirm(`คืนเงินเต็มจำนวน ${label}?\nสิทธิ์ที่ได้จากคำสั่งซื้อนี้จะถูกถอนทันที`) && start(async () => {
          setError(undefined);
          const r = await refund(orderId);
          if (r.error) setError(r.error);
        })}
        className="inline-flex items-center gap-1 rounded-md border border-sell/30 px-2.5 py-1.5 text-xs font-medium text-sell hover:bg-sell-dim disabled:opacity-50"
      >
        <Undo2 aria-hidden className="size-3" /> {busy ? "กำลังคืนเงิน…" : "คืนเงิน"}
      </button>
      {error && <span role="alert" className="mt-1 max-w-48 text-right text-xs text-sell">{error}</span>}
    </span>
  );
}
