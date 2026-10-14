"use client";
import { useState, useTransition } from "react";
import { ShieldOff } from "lucide-react";
import { forfeitInstallmentPlan } from "./actions";

export function ForfeitButton({ planId, label }: { planId: string; label: string }) {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={busy}
        title="ถอนสิทธิ์ทันที ไม่คืนเงินงวดที่จ่ายไปแล้ว"
        aria-label={`ถอนสิทธิ์ ${label}`}
        onClick={() => confirm(`ถอนสิทธิ์ ${label}?\nใช้เมื่อลูกค้าไม่ชำระงวดถัดไป สิทธิ์ใช้งานจะถูกถอนทันที และงวดที่จ่ายไปแล้วจะไม่คืนเงิน`) && start(async () => {
          setError(undefined);
          const r = await forfeitInstallmentPlan(planId);
          if (r.error) setError(r.error);
        })}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-sell/40 px-4 text-sm font-semibold whitespace-nowrap text-sell transition-colors hover:bg-sell-dim disabled:opacity-50"
      >
        <ShieldOff aria-hidden className="size-3.5" />
        {busy ? "กำลังถอนสิทธิ์…" : "ถอนสิทธิ์ (ผ่อนไม่สำเร็จ)"}
      </button>
      {error && <span role="alert" className="mt-1 max-w-56 text-right text-xs text-sell">{error}</span>}
    </span>
  );
}
