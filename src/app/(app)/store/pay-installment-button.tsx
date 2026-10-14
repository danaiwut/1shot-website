"use client";
import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { payInstallment } from "@/lib/store/actions";
import { fmtTHB } from "@/lib/store/pricing";

export function PayInstallmentButton({ planId, amountSatang }: { planId: string; amountSatang: number }) {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={busy}
        onClick={() => start(async () => {
          setError(undefined);
          const r = await payInstallment(planId);
          if (r.error) setError(r.error);
        })}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
      >
        {busy ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <ArrowRight aria-hidden className="size-3.5" />}
        {busy ? "กำลังไปหน้าชำระเงิน…" : `จ่ายงวดถัดไป ${fmtTHB(amountSatang)}`}
      </button>
      {error && <span role="alert" className="mt-1 max-w-56 text-right text-xs text-sell">{error}</span>}
    </span>
  );
}
