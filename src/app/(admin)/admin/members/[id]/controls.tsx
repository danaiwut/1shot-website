"use client";
import { useState, useTransition } from "react";
import { Button, cx, Select } from "@/components/ui";
import type { Role } from "@/lib/types";
import { revokeRight, setIbVerified, setRole, unlinkTelegram } from "../../actions";

function useAction() {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();
  const run = (fn: () => Promise<unknown>) => start(async () => {
    setError(undefined);
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "ผิดพลาด"); }
  });
  return { busy, error, run };
}

export function IbToggle({ userId, verified, disabled }: { userId: string; verified: boolean; disabled?: boolean }) {
  const { busy, error, run } = useAction();
  return (
    <span className="flex flex-wrap items-center justify-end gap-2">
      {error && <span role="alert" className="text-sm text-sell">{error}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={verified}
        aria-label="ผ่านการตรวจ IB"
        disabled={busy || disabled}
        onClick={() => run(() => setIbVerified(userId, !verified))}
        className="group inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40"
      >
        <span aria-hidden className={cx("text-xs", verified ? "text-buy" : "text-muted")}>{verified ? "ผ่านแล้ว" : "ยังไม่ผ่าน"}</span>
        <span aria-hidden className={cx("relative h-6 w-11 shrink-0 rounded-full border border-transparent transition-colors", verified ? "bg-buy" : "bg-line-strong")}>
          <span className={cx("absolute top-0.5 size-[18px] rounded-full bg-white transition-all", verified ? "left-[22px]" : "left-0.5")} />
        </span>
      </button>
    </span>
  );
}

export function RoleSelect({ userId, role }: { userId: string; role: Role }) {
  const { busy, error, run } = useAction();
  return (
    <span className="flex flex-wrap items-center justify-end gap-2">
      {error && <span role="alert" className="text-sm text-sell">{error}</span>}
      <Select aria-label="บทบาท" className="w-36" defaultValue={role} disabled={busy} onChange={(e) => run(() => setRole(userId, e.target.value as Role))}>
        <option value="member">สมาชิก</option>
        <option value="admin">แอดมิน</option>
        <option value="owner">เจ้าของ</option>
      </Select>
    </span>
  );
}

export function RevokeButton({ userId, code }: { userId: string; code: string }) {
  const { busy, run } = useAction();
  return (
    <Button
      variant="ghost"
      className="text-sell hover:text-sell"
      aria-label={`ยกเลิกสิทธิ์ ${code}`}
      disabled={busy}
      onClick={() => confirm(`ยกเลิกสิทธิ์ ${code}?`) && run(() => revokeRight(userId, code))}
    >
      ยกเลิก
    </Button>
  );
}

export function UnlinkButton({ userId }: { userId: string }) {
  const { busy, run } = useAction();
  return (
    <Button variant="ghost" className="text-sell hover:text-sell" disabled={busy} onClick={() => confirm("ยกเลิกการเชื่อม Telegram?") && run(() => unlinkTelegram(userId))}>
      ยกเลิกการเชื่อม
    </Button>
  );
}
