"use client";
import { useActionState, useState, useTransition } from "react";
import { EmptyLine, Status } from "@/components/app/kit";
import { Button, cx, Field, Input, Notice, Select } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { fmtTHB, priceSuffix, termLabel } from "@/lib/store/pricing";
import type { Product, ProductPrice } from "@/lib/types";
import { addPrice, createProduct, deletePrice, deleteProduct, setPriceActive, updateProduct, type ProductState } from "./actions";

type Indicator = { code: string; name: string };

const area = "field-sizing-fixed bg-panel text-sm placeholder:text-faint focus-visible:border-brand/70";

export function ProductForm({ product, indicators }: { product?: Product; indicators: Indicator[] }) {
  const [state, action, pending] = useActionState<ProductState, FormData>(product ? updateProduct : createProduct, {});
  const [codes, setCodes] = useState<string[]>(product?.codes ?? []);
  const [kind, setKind] = useState<Product["kind"]>(product?.kind ?? "single");
  const toggle = (c: string) => setCodes((cur) => (kind === "single" ? [c] : cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  const until = product?.available_until
    ? new Date(new Date(product.available_until).getTime() + 7 * 3600_000).toISOString().slice(0, 10) // Bangkok date
    : "";

  return (
    <form action={action} className="@container space-y-5">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-4 @md:grid-cols-[1fr_12rem]">
        <Field label="ชื่อสินค้า" required><Input name="name" defaultValue={product?.name} required maxLength={120} placeholder="เช่น ICT Pack" /></Field>
        <Field label="ประเภท">
          <Select name="kind" value={kind} onChange={(e) => { const k = e.target.value as Product["kind"]; setKind(k); if (k === "single") setCodes((c) => c.slice(0, 1)); }}>
            <option value="single">รายตัว</option>
            <option value="bundle">แพ็กเกจรวม / จับคู่ (ตัวที่กำหนด)</option>
            <option value="pick">โปรเลือกเอง (ลูกค้าเลือก N ตัว)</option>
          </Select>
        </Field>
      </div>
      <Field label="คำอธิบาย"><Textarea name="description" defaultValue={product?.description} maxLength={600} rows={2} className={area} /></Field>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          {kind === "pick" ? `ตัวที่ลูกค้าเลือกได้ (${codes.length} ตัว)` : `อินดิเคเตอร์ที่ได้ ${kind === "single" ? "(เลือก 1 ตัว)" : `(${codes.length} ตัว)`}`}
        </legend>
        {kind === "bundle" && <p className="mb-2 text-xs text-muted">เลือก 2 ตัวเพื่อทำราคาจับคู่ ราคาขีดฆ่าคำนวณจากราคารายตัวรวมกันอัตโนมัติ</p>}
        <div className="flex flex-wrap gap-2">
          {indicators.map((i) => {
            const on = codes.includes(i.code);
            return (
              <label key={i.code} title={i.name} className={cx("num inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3.5 text-sm font-semibold transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50", on ? "border-brand bg-brand-dim text-fg" : "border-line bg-panel text-muted hover:border-line-strong hover:text-fg")}>
                <input type="checkbox" name="codes" value={i.code} checked={on} onChange={() => toggle(i.code)} className="sr-only" />
                {on && <svg aria-hidden viewBox="0 0 12 12" className="size-3"><path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                {i.code}
              </label>
            );
          })}
        </div>
      </fieldset>

      {kind === "pick" && (
        <Field label="ลูกค้าเลือกได้กี่ตัว" required hint="ราคาขีดฆ่า = ราคารายตัวของตัวที่ลูกค้าเลือกรวมกัน ขายได้เฉพาะแบบจ่ายครั้งเดียว">
          <Input name="pick_count" type="number" min={1} max={Math.max(1, codes.length)} defaultValue={product?.pick_count ?? 2} className="w-24" />
        </Field>
      )}

      <div className="grid gap-4 @md:grid-cols-3">
        <Field label="ใครซื้อได้">
          <Select name="audience" defaultValue={product?.audience ?? "all"}>
            <option value="all">ทุกคน</option>
            <option value="returning">เฉพาะลูกค้าเก่า</option>
          </Select>
        </Field>
        <Field label="ขายถึงวันที่" hint="ว่าง = ไม่มีวันหมด">
          <Input name="available_until" type="date" defaultValue={until} />
        </Field>
        <Field label="ป้าย" hint="เช่น HOT, โปรเดือนนี้">
          <Input name="badge" defaultValue={product?.badge ?? ""} maxLength={24} />
        </Field>
      </div>

      <Field label="จุดเด่น" hint="บรรทัดละ 1 ข้อ แสดงเป็นเช็กลิสต์บนการ์ดสินค้า">
        <Textarea name="features" defaultValue={product?.features.join("\n")} rows={3} className={area} />
      </Field>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <Field label="ลำดับ"><Input name="sort" type="number" defaultValue={product?.sort ?? 100} className="w-24" /></Field>
        <Check name="active" label="เปิดขาย" defaultChecked={product?.active ?? true} />
        <Check name="featured" label="แนะนำ (การ์ดเด่น)" defaultChecked={product?.featured ?? false} />
      </div>

      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <Button type="submit" disabled={pending}>{pending ? "กำลังบันทึก…" : product ? "บันทึก" : "สร้างสินค้า"}</Button>
        {product && <DeleteProduct id={product.id} />}
      </div>
    </form>
  );
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-5 accent-[var(--color-brand)]" />
      {label}
    </label>
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
  if (!prices.length) return <div className="rounded-lg border border-line bg-panel"><EmptyLine>ยังไม่มีราคา เพิ่มด้านล่างเพื่อเปิดขาย</EmptyLine></div>;
  return (
    <ul className="divide-y divide-line rounded-lg border border-line bg-panel">
      {prices.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
          <div className={cx(!p.active && "text-muted")}>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium">{termLabel(p)} <Status tone={p.active ? "good" : "neutral"}>{p.active ? "เปิดขาย" : "ปิดขาย"}</Status></p>
            <p className="text-sm text-muted">{p.billing === "subscription" ? "ตัดบัตรอัตโนมัติ" : "จ่ายครั้งเดียว"}</p>
            <p className="num mt-0.5 text-base font-semibold tabular-nums">{fmtTHB(p.amount_satang)} <span className="text-xs font-normal text-muted">{priceSuffix(p)}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" aria-label={`${p.active ? "ปิดขาย" : "เปิดขาย"} ${termLabel(p)} ${fmtTHB(p.amount_satang)}`} disabled={busy} onClick={() => start(() => setPriceActive(p.id, productId, !p.active))}>
              {p.active ? "ปิดขาย" : "เปิดขาย"}
            </Button>
            <Button variant="ghost" className="text-sell hover:text-sell" aria-label={`ลบราคา ${termLabel(p)} ${fmtTHB(p.amount_satang)}`} disabled={busy} onClick={() => confirm("ลบราคานี้?") && start(() => deletePrice(p.id, productId))}>
              ลบ
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AddPriceForm({ productId, kind = "single" }: { productId: string; kind?: Product["kind"] }) {
  const [state, action, pending] = useActionState<ProductState, FormData>(addPrice, {});
  const [billing, setBilling] = useState<"subscription" | "one_time">(kind === "pick" ? "one_time" : "subscription");
  const [duration, setDuration] = useState(kind === "pick" ? "lifetime" : "30");
  return (
    <form action={action} className="@container space-y-4 pt-4">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="kind" value={kind} />
      <h3 className="text-sm font-semibold">เพิ่มราคา</h3>
      <div className="grid gap-3 @lg:grid-cols-3">
        <Field label="รูปแบบ">
          <Select name="billing" value={billing} onChange={(e) => setBilling(e.target.value as "subscription" | "one_time")}>
            {kind !== "pick" && <option value="subscription">รายงวด (ตัดบัตรอัตโนมัติ)</option>}
            <option value="one_time">จ่ายครั้งเดียว</option>
          </Select>
        </Field>
        {billing === "subscription" ? (
          <Field label="รอบ">
            <Select name="interval" defaultValue="month">
              <option value="month">รายเดือน</option>
              <option value="year">รายปี</option>
            </Select>
          </Field>
        ) : (
          <Field label="ระยะเวลา">
            <Select name="duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="30">30 วัน</option>
              <option value="90">90 วัน</option>
              <option value="180">180 วัน</option>
              <option value="365">1 ปี</option>
              <option value="lifetime">ตลอดชีพ</option>
              <option value="custom">กำหนดเอง…</option>
            </Select>
          </Field>
        )}
        <Field label="ราคา (บาท)" required><Input name="amount" inputMode="decimal" required placeholder="990" /></Field>
      </div>
      {billing === "one_time" && duration === "custom" && (
        <Field label="จำนวนวัน" required><Input name="days" type="number" min={1} max={3650} required className="w-32" /></Field>
      )}
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <Button type="submit" variant="outline" disabled={pending}>{pending ? "กำลังเพิ่ม…" : "เพิ่มราคา"}</Button>
    </form>
  );
}
