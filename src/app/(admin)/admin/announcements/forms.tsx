"use client";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button, Field, Input, Notice } from "@/components/ui";
import type { Announcement } from "@/lib/types";
import { deleteAnnouncement, saveAnnouncement, type AnnState } from "./actions";

export function AnnouncementForm({ item }: { item?: Announcement }) {
  const [state, action, pending] = useActionState<AnnState, FormData>(saveAnnouncement, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok && !item) ref.current?.reset(); }, [state, item]);
  return (
    <form ref={ref} action={action} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}
      <Field label="หัวข้อ"><Input name="title" required maxLength={160} defaultValue={item?.title} /></Field>
      <Field label="เนื้อหา">
        <textarea name="body" rows={item ? 4 : 5} maxLength={8000} defaultValue={item?.body}
          className="w-full rounded-lg border border-line-strong bg-panel px-3 py-2.5 text-base text-fg focus:border-brand focus:outline-none" />
      </Field>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="published" defaultChecked={item?.published ?? true} className="size-5 accent-[var(--color-brand)]" /> เผยแพร่ให้สมาชิกเห็น</label>
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="pinned" defaultChecked={item?.pinned ?? false} className="size-5 accent-[var(--color-brand)]" /> ปักหมุดไว้ด้านบน</label>
      </div>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>{pending ? "กำลังบันทึก…" : item ? "บันทึกการแก้ไข" : "โพสต์ประกาศ"}</Button>
        {item && <DeleteButton id={item.id} title={item.title} />}
      </div>
    </form>
  );
}

function DeleteButton({ id, title }: { id: string; title: string }) {
  const [busy, start] = useTransition();
  return (
    <Button type="button" variant="danger" disabled={busy} aria-label={`ลบประกาศ ${title}`} onClick={() => confirm(`ลบประกาศ “${title}”?`) && start(() => deleteAnnouncement(id))}>
      <Trash2 aria-hidden className="size-4" /> ลบ
    </Button>
  );
}
