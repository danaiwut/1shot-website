"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui";
import { assignToMe, setRequestStatus } from "./actions";

export function RequestControls({ id, status, assigned }: { id: string; status: string; assigned: boolean }) {
  const [busy, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      {!assigned && <Button variant="outline" disabled={busy} onClick={() => start(() => assignToMe(id))}>รับเรื่องนี้</Button>}
      {status === "resolved" ? (
        <Button variant="outline" disabled={busy} onClick={() => start(() => setRequestStatus(id, "open"))}>เปิดเรื่องอีกครั้ง</Button>
      ) : (
        <Button variant="outline" disabled={busy} onClick={() => start(() => setRequestStatus(id, "resolved"))}>ปิดเรื่อง (เสร็จสิ้น)</Button>
      )}
    </div>
  );
}
