"use client";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { Button, Field, Input, Notice } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import type { Promotion } from "@/lib/types";
import { deletePromotion, savePromotion, type PromoState } from "./actions";

export function PromotionForm({ item, today }: { item?: Promotion; today: string }) {
  const [state, action, pending] = useActionState<PromoState, FormData>(savePromotion, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok && !item) ref.current?.reset(); }, [state, item]);
  const monthEnd = (() => { const d = new Date(`${today}T00:00:00`); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString("en-CA"); })();
  return (
    <form ref={ref} action={action} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}
      <Field label="หัวข้อ" required><Input name="title" required maxLength={120} defaultValue={item?.title} placeholder="เช่น ลด 20% ทุกแพ็กเกจรายปี" /></Field>
      <Field label="รายละเอียด" hint="สั้น ๆ 1–2 ประโยค">
        <Textarea name="body" rows={3} maxLength={600} defaultValue={item?.body} className="field-sizing-fixed bg-panel text-sm" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ป้ายเล็ก" hint="เช่น โปรเดือนตุลาคม"><Input name="badge" maxLength={40} defaultValue={item?.badge ?? ""} /></Field>
        <Field label="โค้ดส่วนลด" hint="สร้างโค้ดเดียวกันใน Stripe › Promotion codes ลูกค้ากรอกตอนชำระเงิน"><Input name="code" maxLength={40} defaultValue={item?.code ?? ""} className="num uppercase" /></Field>
        <Field label="ข้อความปุ่ม" hint="เว้นว่าง = ดูแพ็กเกจ"><Input name="cta_label" maxLength={40} defaultValue={item?.cta_label ?? ""} /></Field>
        <Field label="ลิงก์ปุ่ม" hint="/pricing หรือ https://…"><Input name="cta_href" maxLength={300} defaultValue={item?.cta_href ?? ""} placeholder="/pricing" /></Field>
        <Field label="รูปโปสเตอร์" hint="ไม่บังคับ · /media/… หรือ https://…"><Input name="image_url" maxLength={300} defaultValue={item?.image_url ?? ""} placeholder="/media/indicators/promo-oct.jpg" /></Field>
        <Field label="เริ่ม" required><Input type="date" name="starts_on" required defaultValue={item?.starts_on ?? today} /></Field>
        <Field label="สิ้นสุด" required><Input type="date" name="ends_on" required defaultValue={item?.ends_on ?? monthEnd} /></Field>
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={item?.active ?? true} className="size-5 accent-[var(--color-brand)]" /> แสดงบนหน้าเว็บ (ภายในช่วงวันที่)
      </label>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant={item ? "outline" : "brand"} disabled={pending}>{pending ? "กำลังบันทึก…" : item ? "บันทึกการแก้ไข" : "สร้างโปรโมชัน"}</Button>
        {item && <DeleteButton id={item.id} title={item.title} />}
      </div>
    </form>
  );
}

function DeleteButton({ id, title }: { id: string; title: string }) {
  const [busy, start] = useTransition();
  return (
    <Button type="button" variant="ghost" className="text-sell hover:text-sell" disabled={busy} aria-label={`ลบโปรโมชัน ${title}`} onClick={() => confirm(`ลบโปรโมชัน “${title}”?`) && start(() => deletePromotion(id))}>
      ลบ
    </Button>
  );
}
