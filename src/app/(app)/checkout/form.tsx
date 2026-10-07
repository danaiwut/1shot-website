"use client";
import { useActionState, useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { DealPicker, pickCompare } from "@/components/store/deal-picker";
import { Button, Field, Input, Notice } from "@/components/ui";
import { checkTradingViewName, startCheckout, type CheckoutState } from "@/lib/store/actions";
import { savingPercent } from "@/lib/store/offers";
import { fmtTHB } from "@/lib/store/pricing";

type Pick = {
  count: number;
  pool: { code: string; name: string }[];
  chosen: string[];
  owned: string[];
  parts: Record<string, number>;
  amount: number;
};

export function CheckoutForm({ priceId, tradingview, account, email, pick }: { priceId: string; tradingview: string; account: string; email: string; pick?: Pick }) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});
  const [chosen, setChosen] = useState<string[]>(pick?.chosen ?? []);
  const ready = !pick || chosen.length === pick.count;
  const compare = pick && ready ? pickCompare(pick.parts, chosen, pick.amount) : null;
  const [tv, setTv] = useState<{ ok: boolean; message: string } | null>(null);
  const [checking, start] = useTransition();
  const check = (value: string) => {
    if (!value.trim()) return setTv(null);
    start(async () => setTv(await checkTradingViewName(value)));
  };
  const err = (f: CheckoutState["field"]) => (state.field === f ? state.error : undefined);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="price_id" value={priceId} />
      {pick && (
        <div className="space-y-2">
          <DealPicker pool={pick.pool} count={pick.count} chosen={chosen} onChange={setChosen} owned={pick.owned} />
          {compare && (
            <p className="text-sm">
              <span className="num text-muted line-through">{fmtTHB(compare)}</span>{" "}
              <span className="num font-semibold">{fmtTHB(pick.amount)}</span>{" "}
              <span className="font-medium text-buy">ประหยัด {fmtTHB(compare - pick.amount)} ({savingPercent(compare, pick.amount)}%)</span>
            </p>
          )}
        </div>
      )}
      <Field
        label="ชื่อผู้ใช้ TradingView" required
        hint={checking ? "กำลังตรวจกับ TradingView…" : tv?.message ?? "ระบบจะเปิดสิทธิ์อินดิเคเตอร์ให้ชื่อนี้ใน TradingView หลังชำระเงิน"}
        error={err("tradingview") ?? (tv && !tv.ok && tv.message.startsWith("ไม่พบ") ? tv.message : undefined)}
      >
        <Input name="tradingview" required defaultValue={tradingview} autoComplete="off" spellCheck={false} className="num" onBlur={(e) => check(e.currentTarget.value)} />
      </Field>
      <Field label="เลขบัญชีเทรด (MT5)" required hint="เลขบัญชีที่ใช้เทรด เช่น บัญชี Exness" error={err("account")}>
        <Input name="account" required inputMode="numeric" defaultValue={account} className="num" />
      </Field>
      <Field label="อีเมล" required hint="ใบเสร็จและการแจ้งเตือนจะส่งไปที่อีเมลนี้" error={err("email")}>
        <Input name="email" type="email" required defaultValue={email} autoComplete="email" />
      </Field>
      {state.error && !state.field && <Notice tone="error">{state.error}</Notice>}
      <Button type="submit" className="w-full sm:w-auto" disabled={pending || !ready}>
        <Lock aria-hidden className="size-4" /> {pending ? "กำลังไปหน้าชำระเงิน…" : "ไปชำระเงินกับ Stripe"}
      </Button>
    </form>
  );
}
