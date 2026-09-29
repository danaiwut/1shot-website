"use client";
import { useActionState, useState, useTransition } from "react";
import { Button, Select } from "@/components/ui";
import type { Role } from "@/lib/types";
import { grantRight, revokeRight, setIbVerified, setRole, unlinkTelegram } from "../../actions";

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
    <span className="flex items-center gap-2">
      {error && <span className="text-[11px] text-sell">{error}</span>}
      <button
        role="switch"
        aria-checked={verified}
        disabled={busy || disabled}
        onClick={() => run(() => setIbVerified(userId, !verified))}
        className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-40 ${verified ? "bg-buy" : "bg-panel-3"}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-fg transition-all ${verified ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </span>
  );
}

export function RoleSelect({ userId, role }: { userId: string; role: Role }) {
  const { busy, error, run } = useAction();
  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-[11px] text-sell">{error}</span>}
      <Select className="h-8 w-32 text-xs" defaultValue={role} disabled={busy} onChange={(e) => run(() => setRole(userId, e.target.value as Role))}>
        <option value="member">member</option>
        <option value="admin">admin</option>
        <option value="owner">owner</option>
      </Select>
    </span>
  );
}

export function GrantForm({ userId, code, current, has }: { userId: string; code: string; current: string | null; has: boolean }) {
  const [state, action, pending] = useActionState(grantRight, {});
  const [duration, setDuration] = useState<"lifetime" | "date">(has && current === null ? "lifetime" : "date");
  const defaultDate = current
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(current))
    : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(Date.now() + 30 * 86400000));
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="code" value={code} />
      <Select name="duration" className="h-8 w-28 text-xs" value={duration} onChange={(e) => setDuration(e.target.value as "lifetime" | "date")}>
        <option value="date">ถึงวันที่</option>
        <option value="lifetime">ตลอดชีพ</option>
      </Select>
      {duration === "date" && (
        <input name="expires_on" type="date" defaultValue={defaultDate} className="h-8 rounded-lg border border-line-strong bg-ink/60 px-2 text-xs text-fg [color-scheme:dark]" />
      )}
      <Button type="submit" variant={has ? "outline" : "gold"} className="h-8 px-3 text-xs" disabled={pending}>{has ? "อัปเดต" : "ให้สิทธิ์"}</Button>
      {state.error && <span className="w-full text-right text-[11px] text-sell">{state.error}</span>}
    </form>
  );
}

export function RevokeButton({ userId, code }: { userId: string; code: string }) {
  const { busy, run } = useAction();
  return (
    <Button
      variant="danger"
      className="h-8 px-3 text-xs"
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
    <Button variant="danger" className="h-8 px-3 text-xs" disabled={busy} onClick={() => confirm("ยกเลิกการเชื่อม Telegram?") && run(() => unlinkTelegram(userId))}>
      ยกเลิกการเชื่อม
    </Button>
  );
}
