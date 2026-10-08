"use client";
import { useTransition } from "react";
import { CheckCircle2, Hand, RotateCcw } from "lucide-react";
import { Button, cx } from "@/components/ui";
import { assignToMe, setRequestStatus } from "./actions";

/** Take / close / reopen. `stack` = full-width pills for the right-hand panel. */
export function RequestControls({ id, status, assigned, stack }: { id: string; status: string; assigned: boolean; stack?: boolean }) {
  const [busy, start] = useTransition();
  const pill = cx("h-11 rounded-full px-5 font-semibold", stack && "w-full");
  return (
    <div className={cx("flex gap-2", stack ? "flex-col" : "flex-wrap")}>
      {!assigned && <Button variant="outline" className={pill} disabled={busy} onClick={() => start(() => assignToMe(id))}><Hand aria-hidden />รับเรื่องนี้</Button>}
      {status === "resolved" ? (
        <Button variant="outline" className={pill} disabled={busy} onClick={() => start(() => setRequestStatus(id, "open"))}><RotateCcw aria-hidden />เปิดเรื่องอีกครั้ง</Button>
      ) : (
        <Button className={pill} disabled={busy} onClick={() => start(() => setRequestStatus(id, "resolved"))}><CheckCircle2 aria-hidden />ปิดเรื่อง (เสร็จสิ้น)</Button>
      )}
    </div>
  );
}
