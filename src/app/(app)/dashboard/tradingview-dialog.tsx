"use client";
import { useActionState, useEffect, useState } from "react";
import { Button, Field, Input, Notice } from "@/components/ui";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { saveTradingViewName, type TvNameState } from "./actions";

/** "ไปกรอกชื่อ" on the dashboard: enter the TradingView username in place, no page change. */
export function TradingViewDialog({ current, label, variant = "outline" }: { current: string | null; label: string; variant?: "outline" | "brand" }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<TvNameState, FormData>(saveTradingViewName, {});
  useEffect(() => {
    if (!state.ok) return;
    const t = setTimeout(() => setOpen(false), 900);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant={variant}>{label}</Button></DialogTrigger>
      <DialogContent className="rounded-lg sm:max-w-md">
        <form action={action} className="space-y-5">
          <DialogHeader>
            <DialogTitle>ชื่อผู้ใช้ TradingView</DialogTitle>
            <DialogDescription className="text-muted">เราใช้ชื่อนี้เปิดสิทธิ์อินดิเคเตอร์ให้คุณใน TradingView ระบบจะตรวจว่ามีบัญชีนี้จริง</DialogDescription>
          </DialogHeader>
          <Field label="ชื่อผู้ใช้" hint="ดูได้ที่รูปโปรไฟล์มุมขวาบนของ TradingView" required>
            <Input name="tradingview" required autoFocus maxLength={64} defaultValue={current ?? ""} autoComplete="off" spellCheck={false} className="num" />
          </Field>
          {state.error && <Notice tone="error">{state.error}</Notice>}
          {state.ok && <Notice tone="success">{state.ok}</Notice>}
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button type="button" variant="ghost">ยกเลิก</Button></DialogClose>
            <Button type="submit" disabled={pending}>{pending ? "กำลังตรวจสอบ…" : "บันทึก"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
