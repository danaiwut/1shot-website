"use client";
import { useActionState, useState, useTransition } from "react";
import { Copy, ImageUp } from "lucide-react";
import { ChoiceTiles, FormLayout, Panel, Step, SubmitButton, Switch } from "@/components/app/form-kit";
import { Button, cx, Field, Input, Notice } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import type { Promotion } from "@/lib/types";
import { deletePromotion, savePromotion, type PromoState } from "./actions";

const area = "field-sizing-fixed bg-panel text-sm placeholder:text-faint focus-visible:border-brand/70";
const thaiDate = (day: string) => new Date(`${day}T00:00:00+07:00`).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" });
const addDays = (day: string, n: number) => { const d = new Date(`${day}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** Create / edit the homepage promo banner: steps on the left, the heading as customers see it on the right. */
export function PromotionForm({ item, today }: { item?: Promotion; today: string }) {
  const [state, action, pending] = useActionState<PromoState, FormData>(savePromotion, {});
  const monthEnd = (() => { const d = new Date(`${today}T00:00:00`); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toLocaleDateString("en-CA"); })();
  const init = {
    title: item?.title ?? "", body: item?.body ?? "", badge: item?.badge ?? "", code: item?.code ?? "",
    cta_label: item?.cta_label ?? "", cta_href: item?.cta_href ?? "", image_url: item?.image_url ?? "",
    image_scope: item?.image_scope ?? "home" as "home" | "all",
    starts_on: item?.starts_on ?? today, ends_on: item?.ends_on ?? monthEnd, active: item?.active ?? true,
  };
  const [v, setV] = useState(init);
  const set = <K extends keyof typeof init>(k: K) => (x: (typeof init)[K]) => setV((cur) => ({ ...cur, [k]: x }));
  const on = (k: Exclude<keyof typeof init, "active" | "image_scope">) => ({ value: v[k], onChange: (e: { target: { value: string } }) => set(k)(e.target.value) });
  const [seen, setSeen] = useState(state); // clear the form after a successful create
  if (seen !== state) { setSeen(state); if (state.ok && !item) setV(init); }
  const [file, setFile] = useState<string | null>(null); // object-URL preview of a newly chosen file
  const [removeImage, setRemoveImage] = useState(false);
  const shownImage = file ?? (removeImage ? null : v.image_url);

  const live = !v.active ? { tone: "bg-panel-3 text-muted", label: "ปิดอยู่ ไม่แสดงบนเว็บ" }
    : v.ends_on && v.ends_on < today ? { tone: "bg-panel-3 text-muted", label: "หมดเวลาแล้ว" }
      : v.starts_on > today ? { tone: "bg-brand-dim text-accent", label: `เริ่มแสดง ${thaiDate(v.starts_on)}` }
        : { tone: "bg-buy-dim text-buy", label: "แสดงบนหน้าแรกตอนนี้" };
  const presets = [["7 วัน", addDays(v.starts_on || today, 6)], ["14 วัน", addDays(v.starts_on || today, 13)], ["ถึงสิ้นเดือน", monthEnd]] as const;

  return (
    <form action={action}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <FormLayout aside={<>
        <Panel title="ตัวอย่างบนหน้าแรก">
          <div className="rounded-xl border border-line bg-panel-2 px-4 py-6 text-center">
            {shownImage && (
              // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded poster
              <img src={shownImage} alt="" className="mx-auto mb-4 w-full max-w-xs rounded-xl object-cover" />
            )}
            {v.badge && <p className="inline-flex rounded-full bg-brand-dim px-3 py-1 text-xs font-semibold text-accent">{v.badge}</p>}
            <p className={cx("text-2xl leading-tight font-bold tracking-tight text-balance", v.badge && "mt-3")}>{v.title || <span className="opacity-40">หัวข้อโปรโมชัน</span>}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{v.body || "ซื้อเป็นคู่หรือเป็นแพ็กเกจ คุ้มกว่าซื้อแยกรายตัว"}</p>
            <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs">
              {v.ends_on && <span className="text-muted">โปรโมชั่นถึง {thaiDate(v.ends_on)}</span>}
              {v.code && <span className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-dashed border-line-strong px-2.5 font-semibold">โค้ด <span className="num tracking-wider uppercase">{v.code}</span><Copy aria-hidden className="size-3.5 text-muted" /></span>}
            </p>
          </div>
          <p className={cx("mt-3 rounded-lg px-3 py-2 text-center text-xs font-semibold", live.tone)}>{live.label}</p>
        </Panel>
        <div className="rounded-2xl border border-line bg-panel p-2 shadow-[0_20px_60px_-40px_rgb(0_0_0/0.35)]">
          <Switch name="active" label="แสดงบนหน้าเว็บ" hint="ภายในช่วงวันที่ที่ตั้งไว้" checked={v.active} onChange={set("active")} />
        </div>
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.ok && <Notice tone="success">{state.ok}</Notice>}
        <SubmitButton pending={pending}>{item ? "บันทึกการแก้ไข" : "สร้างป้ายโปร"}</SubmitButton>
        {item && <div className="text-center"><DeleteButton id={item.id} title={item.title} /></div>}
      </>}>
        <Step n={1} title="ข้อความบนป้าย" hint="แสดงเป็นหัวข้อเหนือตารางแพ็กเกจบนหน้าแรก">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="หัวข้อ" required><Input name="title" required maxLength={120} {...on("title")} placeholder="เช่น ลด 20% ทุกแพ็กเกจรายปี" /></Field>
            <Field label="ป้ายเล็ก" hint="อยู่เหนือหัวข้อ"><Input name="badge" maxLength={40} {...on("badge")} placeholder="เช่น โปรเดือนตุลาคม" /></Field>
          </div>
          <div className="mt-4">
            <Field label="รายละเอียด" hint="1–2 ประโยค · ว่าง = ข้อความมาตรฐาน">
              <Textarea name="body" rows={3} maxLength={600} {...on("body")} className={area} placeholder="ซื้อแพ็กเกจรายปีวันนี้ ลดทันที 20% ใช้ได้ถึงสิ้นเดือน" />
            </Field>
          </div>
        </Step>

        <Step n={2} title="ช่วงเวลา" hint="ป้ายขึ้นเองตอนเริ่ม และหายไปเองหลังวันสิ้นสุด">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="เริ่ม" required><Input type="date" name="starts_on" required {...on("starts_on")} /></Field>
            <Field label="สิ้นสุด" required><Input type="date" name="ends_on" required min={v.starts_on} {...on("ends_on")} /></Field>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">ตั้งเร็ว:</span>
            {presets.map(([label, day]) => (
              <button key={label} type="button" onClick={() => set("ends_on")(day)} className={cx(
                "min-h-9 rounded-full border px-3.5 text-sm font-medium transition-colors",
                v.ends_on === day ? "border-brand bg-brand-dim text-accent" : "border-line hover:border-line-strong",
              )}>{label}</button>
            ))}
          </div>
        </Step>

        <Step n={3} title="โค้ดส่วนลด" hint="สร้างโค้ดเดียวกันใน Stripe › Promotion codes ลูกค้ากรอกตอนชำระเงิน">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="โค้ด" hint="A–Z, 0–9, - และ _ · ว่าง = ไม่มีโค้ด"><Input name="code" maxLength={40} {...on("code")} className="num uppercase" placeholder="OCT20" /></Field>
          </div>
        </Step>

        <Step n={4} title="ปุ่มและรูป" aside={<span className="rounded-full bg-panel-3 px-2.5 py-0.5 text-xs font-semibold text-muted">ไม่บังคับ</span>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ข้อความปุ่ม" hint="ว่าง = ดูแพ็กเกจ"><Input name="cta_label" maxLength={40} {...on("cta_label")} placeholder="ดูโปรเลย" /></Field>
            <Field label="ลิงก์ปุ่ม" hint="/pricing หรือ https://…"><Input name="cta_href" maxLength={300} {...on("cta_href")} placeholder="/pricing" /></Field>
          </div>

          <div className="mt-4">
            <span className="mb-2 block text-sm font-medium">รูปโปสเตอร์</span>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center">
              <div className="surface-dark grid aspect-video place-items-center overflow-hidden rounded-xl border border-line bg-ink">
                {shownImage
                  // eslint-disable-next-line @next/next/no-img-element -- local preview or Supabase Storage URL
                  ? <img src={shownImage} alt="" className="size-full object-cover" />
                  : <span className="text-sm text-white/50">ยังไม่มีรูป</span>}
              </div>
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong bg-panel-2 px-4 py-5 text-center text-sm font-semibold transition-colors hover:border-brand has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
                <ImageUp aria-hidden className="size-6 text-accent" />
                {file ? "เลือกรูปอื่น" : v.image_url ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
                <span className="text-xs font-normal text-muted">PNG, JPG หรือ WebP ไม่เกิน 5 MB</span>
                <input
                  type="file" name="image" accept="image/png,image/jpeg,image/webp" className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; setFile(f ? URL.createObjectURL(f) : null); if (f) setRemoveImage(false); }}
                />
              </label>
            </div>
            {v.image_url && !file && (
              <div className="mt-3 rounded-xl border border-line bg-panel p-2">
                <Switch name="remove_image" label="ลบรูปนี้" hint="หน้าแรกจะแสดงแค่ข้อความ ไม่มีรูป" checked={removeImage} onChange={setRemoveImage} />
              </div>
            )}
          </div>

          <div className="mt-4">
            <ChoiceTiles name="image_scope" label="แสดงรูปที่หน้าไหน" value={v.image_scope} onChange={set("image_scope")} columns="grid-cols-2" options={[
              { value: "home", title: "เฉพาะหน้าแรก", line: "หน้าอื่นเห็นแค่หัวข้อ" },
              { value: "all", title: "ทุกหน้า", line: "หน้าแรก, /pricing, /store" },
            ]} />
          </div>
        </Step>
      </FormLayout>
    </form>
  );
}

function DeleteButton({ id, title }: { id: string; title: string }) {
  const [busy, start] = useTransition();
  return (
    <Button type="button" variant="ghost" className="text-sell hover:text-sell" disabled={busy} aria-label={`ลบโปรโมชัน ${title}`}
      onClick={() => confirm(`ลบโปรโมชัน “${title}”?`) && start(() => deletePromotion(id))}>
      ลบโปรโมชันนี้
    </Button>
  );
}
