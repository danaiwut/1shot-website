"use client";
import { useActionState, useTransition } from "react";
import { Button, Field, Input, Notice } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { addNews, deleteBrief, deleteNews, saveBrief } from "./actions";

const area = "field-sizing-fixed bg-panel text-sm placeholder:text-faint focus-visible:border-brand/70";

export function BriefForm({ today, brief }: { today: string; brief?: { brief_date: string; story: string; facts: string } }) {
  const [state, action, pending] = useActionState(saveBrief, {});
  return (
    <form action={action} className="space-y-5" key={brief?.brief_date ?? today}>
      <Field label="วันที่" required hint="ถ้ามีสรุปของวันนั้นอยู่แล้ว จะบันทึกทับ">
        <Input name="brief_date" type="date" required defaultValue={brief?.brief_date ?? today} className="w-44" />
      </Field>
      <Field label="สรุปเช้า" required>
        <Textarea name="story" required rows={8} maxLength={6000} defaultValue={brief?.story} className={area} />
      </Field>
      <Field label="ข้อเท็จจริงที่ใช้สรุป" hint="แสดงในหัวข้อ “ข้อเท็จจริงที่ใช้สรุป” ใต้สรุป">
        <Textarea name="facts" rows={4} maxLength={6000} defaultValue={brief?.facts} className={area} />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <Button type="submit" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึกสรุป"}</Button>
    </form>
  );
}

export function NewsForm({ now }: { now: string }) {
  const [state, action, pending] = useActionState(addNews, {});
  return (
    <form action={action} className="@container space-y-4">
      <Field label="หัวข้อ (ต้นฉบับ)" required><Input name="title" required maxLength={300} /></Field>
      <Field label="หัวข้อภาษาไทย"><Input name="title_th" maxLength={300} /></Field>
      <div className="grid gap-4 @lg:grid-cols-2">
        <Field label="ลิงก์" required><Input name="link" type="url" required placeholder="https://" /></Field>
        <Field label="แหล่งข่าว" required><Input name="source" required maxLength={80} placeholder="เช่น Reuters" /></Field>
      </div>
      <Field label="ผลต่อทองคำ" hint="ขึ้นต้นด้วย “หนุน…” หรือ “กดดัน…” จะแสดงเป็นสีเขียว/แดง">
        <Input name="gold_impact" maxLength={500} />
      </Field>
      <Field label="เวลาเผยแพร่ (เวลาไทย)" required>
        <Input name="published_at" type="datetime-local" required defaultValue={now} className="w-full sm:w-60" />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <Button type="submit" variant="outline" disabled={pending}>{pending ? "กำลังเพิ่ม…" : "เพิ่มข่าว"}</Button>
    </form>
  );
}

export function DeleteNews({ id, title }: { id: number; title: string }) {
  const [busy, start] = useTransition();
  return (
    <Button type="button" variant="ghost" className="shrink-0 text-sell hover:text-sell" aria-label={`ลบข่าว ${title}`} disabled={busy}
      onClick={() => confirm(`ลบข่าว “${title}”?`) && start(() => deleteNews(id))}>
      ลบ
    </Button>
  );
}

export function DeleteBrief({ date }: { date: string }) {
  const [busy, start] = useTransition();
  return (
    <Button type="button" variant="ghost" className="text-sell hover:text-sell" aria-label={`ลบสรุปวันที่ ${date}`} disabled={busy}
      onClick={() => confirm(`ลบสรุปวันที่ ${date}?`) && start(() => deleteBrief(date))}>
      ลบ
    </Button>
  );
}
