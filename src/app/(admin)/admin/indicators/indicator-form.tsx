"use client";
import { useActionState, useState } from "react";
import { ImageUp } from "lucide-react";
import { FormLayout, Panel, Step, SubmitButton, Switch } from "@/components/app/form-kit";
import { Field, Input, Notice } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import type { PublicIndicator } from "@/lib/indicators";
import { saveIndicator, type AdminState } from "../actions";

const area = "field-sizing-fixed bg-panel text-sm placeholder:text-faint focus-visible:border-brand/70";

/** Edit one indicator: numbered steps on the left, a live store-card preview + save on the right. */
export function IndicatorForm({ indicator: i, room, script }: { indicator: PublicIndicator; room: string | null; script: string | null }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveIndicator, {});
  const [file, setFile] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [name, setName] = useState(i.name);
  const [description, setDescription] = useState(i.description);
  const [points, setPoints] = useState(i.points.join("\n"));
  const shown = file ?? (remove ? null : i.image_url);
  const pointList = points.split("\n").map((p) => p.trim()).filter(Boolean);

  const aside = (
    <>
      <Panel title="ตัวอย่างการ์ดในร้าน">
        <article className="overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="surface-dark relative aspect-[4/3] overflow-hidden bg-ink">
            {shown
              // eslint-disable-next-line @next/next/no-img-element -- local preview or Supabase Storage URL
              ? <img src={shown} alt="" className="size-full object-cover object-top" />
              : <span className="num grid size-full place-items-center text-5xl font-black text-white/15">{i.code}</span>}
            <span className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{i.family}</span>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg font-bold tracking-tight">{name || <span className="opacity-50">ชื่อที่แสดง</span>}</p>
              <span className="num shrink-0 rounded-md bg-panel-3 px-2 py-0.5 text-xs font-semibold text-muted">{i.code}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{description || "ยังไม่มีคำอธิบาย"}</p>
            {i.modes.length > 0 && <p className="mt-2 text-xs font-medium text-muted">เข้าแบบ {i.modes.join(" / ")}</p>}
            {pointList.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-line pt-3 text-xs">
                {pointList.slice(0, 8).map((p, n) => <li key={n} className="flex gap-2"><span aria-hidden className="text-accent">✓</span>{p}</li>)}
              </ul>
            )}
          </div>
        </article>
      </Panel>

      {i.image_url && (
        <div className="rounded-2xl border border-line bg-panel p-2">
          <Switch name="remove_image" label="ลบรูปนี้" hint={file ? "มีรูปใหม่แล้ว จะใช้รูปใหม่แทน" : "การ์ดจะแสดงรหัสแทนรูป"} checked={remove} onChange={setRemove} />
        </div>
      )}

      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <SubmitButton pending={pending}>บันทึก {i.code}</SubmitButton>
      <p className="text-center text-xs text-muted">ขึ้นบนหน้าเว็บทันทีหลังบันทึก</p>
    </>
  );

  return (
    <form action={action}>
      <input type="hidden" name="code" value={i.code} />
      <FormLayout aside={aside}>
        <Step n={1} title="ข้อมูลที่แสดง">
          <div className="space-y-4">
            <Field label="ชื่อที่แสดง" required><Input name="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น Smart Money Zones" /></Field>
            <Field label="คำอธิบายสั้น" hint="แสดงบนการ์ดและหัวหน้ารายละเอียด 1–2 ประโยค">
              <Textarea name="description" rows={2} maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} className={area} placeholder="บอกโซนสะสมของรายใหญ่ พร้อมจุดเข้าและจุดตัดขาดทุน" />
            </Field>
          </div>
        </Step>

        <Step n={2} title="รูปบนกราฟ" hint="PNG, JPG หรือ WebP ไม่เกิน 5 MB แนะนำแนวนอน 4:3 หรือ 16:9">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center">
            <div className="surface-dark grid aspect-video place-items-center overflow-hidden rounded-xl border border-line bg-ink">
              {shown
                // eslint-disable-next-line @next/next/no-img-element -- local preview or Supabase Storage URL
                ? <img src={shown} alt={`รูปของ ${i.name}`} className="size-full object-cover" />
                : <span className="text-sm text-white/50">ยังไม่มีรูป</span>}
            </div>
            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-panel-2 px-4 py-5 text-center text-sm font-semibold transition-colors hover:border-brand has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
              <ImageUp aria-hidden className="size-6 text-accent" />
              {file ? "เลือกรูปอื่น" : i.image_url ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
              <span className="text-xs font-normal text-muted">{file ? "รูปใหม่จะบันทึกเมื่อกดบันทึก" : "กดเพื่อเลือกไฟล์"}</span>
              <input
                type="file" name="image" accept="image/png,image/jpeg,image/webp" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; setFile(f ? URL.createObjectURL(f) : null); }}
              />
            </label>
          </div>
        </Step>

        <Step n={3} title="จุดเด่น" hint="บรรทัดละ 1 ข้อ ไม่เกิน 8 ข้อ" aside={<span className="rounded-full bg-panel-3 px-2.5 py-0.5 text-xs font-semibold text-muted tabular-nums">{pointList.length}/8</span>}>
          <Textarea name="points" rows={5} maxLength={3000} value={points} onChange={(e) => setPoints(e.target.value)} className={area} aria-label="จุดเด่น" placeholder={"เห็นโซนรายใหญ่ก่อนราคาวิ่ง\nใช้ได้ทุกไทม์เฟรม\nแจ้งเตือนเข้า Telegram"} />
        </Step>

        {!i.is_reference && (
          <Step n={4} title="ห้อง Telegram / TradingView">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Chat ID ห้อง Telegram" hint="บอทต้องเป็นแอดมินในห้องและเชิญสมาชิกได้">
                <Input name="telegram_room_id" defaultValue={room ?? ""} placeholder="-1001234567890" className="num" />
              </Field>
              <Field label="TradingView script ID" hint="pine_id ของสคริปต์ invite-only ใช้เปิดสิทธิ์อัตโนมัติหลังชำระเงิน">
                <Input name="tv_script_id" defaultValue={script ?? ""} placeholder="PUB;a1b2c3d4e5" className="num" />
              </Field>
            </div>
          </Step>
        )}
      </FormLayout>
    </form>
  );
}
