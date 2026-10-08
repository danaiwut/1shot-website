"use client";
import { useActionState, useState, useTransition } from "react";
import { Check, Layers, Package, Shuffle, type LucideIcon } from "lucide-react";
import { ChoiceTiles, Step, SubmitButton, Switch } from "@/components/app/form-kit";
import { EmptyLine, Status } from "@/components/app/kit";
import { Button, cx, Field, Input, Notice, Select } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { fmtTHB, priceSuffix, termLabel } from "@/lib/store/pricing";
import type { Product, ProductPrice } from "@/lib/types";
import { addPrice, createProduct, deletePrice, deleteProduct, setPriceActive, updateProduct, type ProductState } from "./actions";

type Indicator = { code: string; name: string };

const area = "field-sizing-fixed bg-panel text-sm placeholder:text-faint focus-visible:border-brand/70";

const KINDS: { value: Product["kind"]; icon: LucideIcon; title: string; line: string }[] = [
  { value: "single", icon: Package, title: "รายตัว", line: "อินดิเคเตอร์ 1 ตัว" },
  { value: "bundle", icon: Layers, title: "แพ็กเกจ / จับคู่", line: "หลายตัวที่กำหนดไว้" },
  { value: "pick", icon: Shuffle, title: "โปรเลือกเอง", line: "ลูกค้าเลือก N ตัว" },
];

/** Create / edit a product: numbered steps on the left, a live card preview with the publish switches on the right. */
export function ProductForm({ product, indicators, price }: { product?: Product; indicators: Indicator[]; /** Cheapest live price for the preview, e.g. "฿15,000 · ตลอดชีพ". */ price?: string }) {
  const [state, action, pending] = useActionState<ProductState, FormData>(product ? updateProduct : createProduct, {});
  const [codes, setCodes] = useState<string[]>(product?.codes ?? []);
  const [kind, setKind] = useState<Product["kind"]>(product?.kind ?? "single");
  const [name, setName] = useState(product?.name ?? "");
  const [badge, setBadge] = useState(product?.badge ?? "");
  const [features, setFeatures] = useState(product?.features.join("\n") ?? "");
  const [pick, setPick] = useState(product?.pick_count ?? 2);
  const [active, setActive] = useState(product?.active ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const toggle = (c: string) => setCodes((cur) => (kind === "single" ? [c] : cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  const until = product?.available_until
    ? new Date(new Date(product.available_until).getTime() + 7 * 3600_000).toISOString().slice(0, 10) // Bangkok date
    : "";
  const nameOf = (c: string) => indicators.find((i) => i.code === c)?.name ?? c;
  const featureList = features.split("\n").map((f) => f.trim()).filter(Boolean);

  return (
    <form action={action} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="kind" value={kind} />

      <div className="min-w-0 space-y-6">
        <Step n={1} title="ประเภทสินค้า">
          <div role="radiogroup" aria-label="ประเภทสินค้า" className="grid gap-3 sm:grid-cols-3">
            {KINDS.map((k) => {
              const on = kind === k.value;
              return (
                <label key={k.value} className={cx(
                  "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                  on ? "border-brand bg-brand-dim" : "border-line hover:border-line-strong",
                )}>
                  <input type="radio" name="kind_choice" checked={on} onChange={() => { setKind(k.value); if (k.value === "single") setCodes((c) => c.slice(0, 1)); }} className="sr-only" />
                  <span className={cx("grid size-10 shrink-0 place-items-center rounded-lg", on ? "bg-brand text-white" : "bg-panel-3 text-muted")}><k.icon aria-hidden className="size-5" /></span>
                  <span className="min-w-0"><span className="block font-bold">{k.title}</span><span className="block text-xs text-muted">{k.line}</span></span>
                </label>
              );
            })}
          </div>
        </Step>

        <Step
          n={2}
          title={kind === "pick" ? "ตัวที่ลูกค้าเลือกได้" : "อินดิเคเตอร์ที่ได้"}
          aside={<span className="rounded-full bg-panel-3 px-2.5 py-0.5 text-xs font-semibold text-muted tabular-nums">{kind === "single" ? "เลือก 1 ตัว" : `เลือกแล้ว ${codes.length} ตัว`}</span>}
          hint={kind === "bundle" ? "เลือก 2 ตัวเพื่อทำราคาจับคู่ ราคาขีดฆ่าคำนวณจากราคารายตัวรวมกันอัตโนมัติ" : kind === "pick" ? "ลูกค้าจะเลือกจากรายการนี้ตอนชำระเงิน" : undefined}
        >
          <fieldset>
            <legend className="sr-only">อินดิเคเตอร์</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {indicators.map((i) => {
                const on = codes.includes(i.code);
                return (
                  <label key={i.code} className={cx(
                    "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                    on ? "border-brand bg-brand-dim" : "border-line hover:border-line-strong",
                  )}>
                    <input type={kind === "single" ? "radio" : "checkbox"} name="codes" value={i.code} checked={on} onChange={() => toggle(i.code)} className="sr-only" />
                    <span className={cx("grid size-5 shrink-0 place-items-center border-2", kind === "single" ? "rounded-full" : "rounded-[5px]", on ? "border-brand bg-brand text-white" : "border-line-strong")}>
                      {on && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{i.name}</span>
                    <span className="num shrink-0 text-xs font-bold text-muted">{i.code}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {kind === "pick" && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-panel-2 px-4 py-3">
              <span className="text-sm font-semibold">ลูกค้าเลือกได้</span>
              <Input name="pick_count" type="number" min={1} max={Math.max(1, codes.length)} value={pick} onChange={(e) => setPick(Number(e.target.value))} className="w-20 text-center" aria-label="จำนวนที่ลูกค้าเลือกได้" />
              <span className="text-sm text-muted">ตัว · ราคาขีดฆ่า = ราคารายตัวของตัวที่เลือกรวมกัน ขายได้เฉพาะแบบจ่ายครั้งเดียว</span>
            </div>
          )}
        </Step>

        <Step n={3} title="ชื่อและรายละเอียด">
          <div className="space-y-4">
            <Field label="ชื่อสินค้า" required><Input name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} placeholder="เช่น ICT Pack" /></Field>
            <Field label="คำอธิบาย"><Textarea name="description" defaultValue={product?.description} maxLength={600} rows={2} className={area} placeholder="สั้นๆ 1–2 ประโยค" /></Field>
            <Field label="จุดเด่น" hint="บรรทัดละ 1 ข้อ แสดงเป็นเช็กลิสต์บนการ์ดสินค้า">
              <Textarea name="features" value={features} onChange={(e) => setFeatures(e.target.value)} rows={4} className={area} placeholder={"ใช้งานตลอดชีพ\nเข้ากลุ่ม OpenChat Community"} />
            </Field>
          </div>
        </Step>

        <Step n={4} title="การขาย">
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <Field label="ใครซื้อได้">
              <Select name="audience" defaultValue={product?.audience ?? "all"}>
                <option value="all">ทุกคน</option>
                <option value="returning">เฉพาะลูกค้าเก่า</option>
              </Select>
            </Field>
            <Field label="ขายถึงวันที่" hint="ว่าง = ไม่มีวันหมด"><Input name="available_until" type="date" defaultValue={until} /></Field>
            <Field label="ป้าย" hint="เช่น HOT, โปรเดือนนี้"><Input name="badge" value={badge} onChange={(e) => setBadge(e.target.value)} maxLength={24} /></Field>
            <Field label="ลำดับ" hint="น้อย = แสดงก่อน"><Input name="sort" type="number" defaultValue={product?.sort ?? 100} /></Field>
          </div>
        </Step>
      </div>

      {/* Preview + publish */}
      <aside className="space-y-4 xl:sticky xl:top-24">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-[0_20px_60px_-40px_rgb(0_0_0/0.35)]">
          <p className="mb-3 text-xs font-bold text-muted">ตัวอย่างการ์ด</p>
          <div className={cx(
            "relative rounded-2xl px-5 pt-7 pb-5 text-center",
            featured ? "bg-gradient-to-b from-brand to-brand-strong text-white" : "border border-line bg-panel-2",
          )}>
            {badge && <span className={cx("absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap", featured ? "bg-white text-brand" : "bg-brand text-white")}>{badge}</span>}
            <p className="font-bold">{name || <span className="opacity-50">ชื่อสินค้า</span>}</p>
            <p className={cx("mt-1 text-xs", featured ? "text-white/85" : "text-muted")}>
              {codes.length
                ? kind === "pick" ? `เลือกเอง ${pick} จาก ${codes.length} ตัว` : codes.map(nameOf).join(" + ")
                : "ยังไม่ได้เลือกอินดิเคเตอร์"}
            </p>
            {featureList.length > 0 && (
              <ul className={cx("mt-4 divide-y border-y text-sm", featured ? "divide-white/25 border-white/25" : "divide-line border-line")}>
                {featureList.slice(0, 5).map((f) => <li key={f} className="py-2">{f}</li>)}
              </ul>
            )}
            {price
              ? <p className="mt-4 text-2xl font-extrabold tracking-tight tabular-nums">{price}</p>
              : <p className={cx("mt-4 text-xs", featured ? "text-white/85" : "text-muted")}>{product ? "ยังไม่มีราคาที่เปิดขาย" : "ราคาเพิ่มหลังสร้างสินค้า"}</p>}
          </div>
        </div>

        <div className="space-y-1 rounded-2xl border border-line bg-panel p-2 shadow-[0_20px_60px_-40px_rgb(0_0_0/0.35)]">
          <Switch name="active" label="เปิดขาย" hint="ลูกค้าเห็นในร้านค้า" checked={active} onChange={setActive} />
          <Switch name="featured" label="การ์ดเด่น" hint="การ์ดสีแดงตรงกลาง" checked={featured} onChange={setFeatured} />
        </div>

        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.ok && <Notice tone="success">{state.ok}</Notice>}
        <Button type="submit" disabled={pending} className="h-12 w-full rounded-full text-base font-semibold">
          {pending ? "กำลังบันทึก…" : product ? "บันทึกการแก้ไข" : "สร้างสินค้า แล้วไปตั้งราคา"}
        </Button>
        {product && <div className="text-center"><DeleteProduct id={product.id} /></div>}
      </aside>
    </form>
  );
}

function DeleteProduct({ id }: { id: string }) {
  const [busy, start] = useTransition();
  return (
    <Button type="button" variant="ghost" className="text-sell hover:text-sell" disabled={busy} onClick={() => confirm("ลบสินค้านี้? ประวัติคำสั่งซื้อเดิมยังอยู่") && start(() => deleteProduct(id))}>
      ลบสินค้า
    </Button>
  );
}

export function PriceList({ productId, prices }: { productId: string; prices: ProductPrice[] }) {
  const [busy, start] = useTransition();
  if (!prices.length) return <div className="rounded-2xl border border-dashed border-line-strong"><EmptyLine>ยังไม่มีราคา เพิ่มราคาทางขวาเพื่อเปิดขาย</EmptyLine></div>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {prices.map((p) => (
        <li key={p.id} className={cx("flex flex-col rounded-2xl border p-5", p.active ? "border-line bg-panel" : "border-dashed border-line-strong bg-panel-2 text-muted")}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold">{termLabel(p)}</p>
              <p className="text-xs text-muted">{p.billing === "subscription" ? "ตัดบัตรอัตโนมัติ" : "จ่ายครั้งเดียว"}</p>
            </div>
            <Status tone={p.active ? "good" : "neutral"}>{p.active ? "เปิดขาย" : "ปิดขาย"}</Status>
          </div>
          <p className="mt-4 text-3xl font-black tracking-tight tabular-nums">{fmtTHB(p.amount_satang)} <span className="text-sm font-normal text-muted">{priceSuffix(p)}</span></p>
          <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
            <Button variant="outline" className="h-10 flex-1 rounded-full" aria-label={`${p.active ? "ปิดขาย" : "เปิดขาย"} ${termLabel(p)} ${fmtTHB(p.amount_satang)}`} disabled={busy} onClick={() => start(() => setPriceActive(p.id, productId, !p.active))}>
              {p.active ? "ปิดขาย" : "เปิดขายอีกครั้ง"}
            </Button>
            <Button variant="ghost" className="h-10 rounded-full text-sell hover:text-sell" aria-label={`ลบราคา ${termLabel(p)} ${fmtTHB(p.amount_satang)}`} disabled={busy} onClick={() => confirm("ลบราคานี้?") && start(() => deletePrice(p.id, productId))}>
              ลบ
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

const DURATIONS = [["30", "30 วัน"], ["90", "90 วัน"], ["180", "180 วัน"], ["365", "1 ปี"], ["lifetime", "ตลอดชีพ"], ["custom", "กำหนดเอง"]] as const;

export function AddPriceForm({ productId, kind = "single" }: { productId: string; kind?: Product["kind"] }) {
  const [state, action, pending] = useActionState<ProductState, FormData>(addPrice, {});
  const [billing, setBilling] = useState<"subscription" | "one_time">("one_time");
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [duration, setDuration] = useState<string>("lifetime");
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="kind" value={kind} />
      {kind === "pick"
        ? <input type="hidden" name="billing" value="one_time" />
        : <ChoiceTiles name="billing" label="รูปแบบการจ่าย" value={billing} onChange={setBilling} columns="grid-cols-2" options={[
            { value: "one_time", title: "จ่ายครั้งเดียว", line: "บัตร / PromptPay" },
            { value: "subscription", title: "รายงวด", line: "ตัดบัตรอัตโนมัติ" },
          ]} />}

      {billing === "subscription" ? (
        <ChoiceTiles name="interval" label="รอบ" value={interval} onChange={setInterval} columns="grid-cols-2" options={[
          { value: "month", title: "รายเดือน" }, { value: "year", title: "รายปี" },
        ]} />
      ) : (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">ใช้ได้นาน</legend>
          <input type="hidden" name="duration" value={duration} />
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map(([v, label]) => (
              <label key={v} className={cx(
                "inline-flex h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                duration === v ? "border-brand bg-brand text-white" : "border-line hover:border-line-strong",
              )}>
                <input type="radio" name="duration__choice" checked={duration === v} onChange={() => setDuration(v)} className="sr-only" />{label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {billing === "one_time" && duration === "custom" && (
        <Field label="จำนวนวัน" required><Input name="days" type="number" min={1} max={3650} required className="w-32" /></Field>
      )}

      <Field label="ราคา (บาท)" required>
        <span className="relative block">
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg font-bold text-muted">฿</span>
          <Input name="amount" inputMode="decimal" required placeholder="14,000" className="h-14 pl-10 text-2xl font-extrabold tabular-nums" />
        </span>
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <SubmitButton pending={pending} pendingText="กำลังเพิ่ม…">เพิ่มราคา</SubmitButton>
    </form>
  );
}
