"use client";
import { useActionState } from "react";
import { Button, Input } from "@/components/ui";
import { saveRoom } from "../actions";

export function RoomForm({ code, room }: { code: string; room: string | null }) {
  const [state, action, pending] = useActionState(saveRoom, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="code" value={code} />
      <Input name="telegram_room_id" defaultValue={room ?? ""} placeholder="Chat ID เช่น -100…" className="num h-8 w-52 text-xs" />
      <Button type="submit" variant="outline" className="h-8 px-3 text-xs" disabled={pending}>บันทึก</Button>
      {state.error && <span className="w-full text-[11px] text-sell">{state.error}</span>}
      {state.ok && <span className="text-[11px] text-buy">{state.ok}</span>}
    </form>
  );
}
