"use client";
import { useActionState, useState } from "react";
import { ImageUp } from "lucide-react";
import { Button, Field, Input, Notice } from "@/components/ui";
import type { PublicIndicator } from "@/lib/indicators";
import { saveIndicator, type AdminState } from "../actions";

const textarea = "w-full rounded-lg border border-line-strong bg-panel px-3 py-2.5 text-base text-fg focus:border-brand focus:outline-none";

export function IndicatorForm({ indicator: i, room }: { indicator: PublicIndicator; room: string | null }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveIndicator, {});
  const [preview, setPreview] = useState<string | null>(null);
  const shown = preview ?? i.image_url;

  return (
    <form action={action} className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <input type="hidden" name="code" value={i.code} />
      <div className="space-y-4">
        <Field label="ชื่อที่แสดง" required><Input name="name" required maxLength={80} defaultValue={i.name} /></Field>
        <Field label="คำอธิบายสั้น" hint="แสดงบนการ์ดและหัวหน้ารายละเอียด">
          <textarea name="description" rows={2} maxLength={300} defaultValue={i.description} className={textarea} />
        </Field>
        <Field label="จุดเด่น" hint="บรรทัดละ 1 ข้อ ไม่เกิน 8 ข้อ">
          <textarea name="points" rows={4} maxLength={3000} defaultValue={i.points.join("\n")} className={textarea} />
        </Field>
        {!i.is_reference && (
          <Field label="Chat ID ห้อง Telegram" hint="บอทต้องเป็นแอดมินในห้องและมีสิทธิ์เชิญสมาชิก">
            <Input name="telegram_room_id" defaultValue={room ?? ""} placeholder="-100…" className="num" />
          </Field>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">รูปบนกราฟ TradingView</p>
        <div className="grid aspect-video place-items-center overflow-hidden rounded-xl border border-line bg-panel-3">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview or Supabase Storage URL
            <img src={shown} alt={`รูปปัจจุบันของ ${i.name}`} className="size-full object-cover" />
          ) : (
            <span className="text-sm text-muted">ยังไม่มีรูป</span>
          )}
        </div>
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line-strong px-3 text-sm font-medium hover:border-fg">
          <ImageUp aria-hidden className="size-4" /> {i.image_url ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
          <input
            type="file" name="image" accept="image/png,image/jpeg,image/webp" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; setPreview(f ? URL.createObjectURL(f) : null); }}
          />
        </label>
        <p className="text-xs text-muted">PNG, JPG หรือ WebP ไม่เกิน 5 MB แนะนำ 16:9</p>
        {i.image_url && (
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="remove_image" className="size-5 accent-[var(--color-brand)]" /> ลบรูปนี้</label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "กำลังบันทึก…" : `บันทึก ${i.code}`}</Button>
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.ok && <Notice tone="success">{state.ok}</Notice>}
      </div>
    </form>
  );
}
