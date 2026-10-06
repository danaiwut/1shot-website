"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Search } from "lucide-react";
import { RatingSummary } from "@/components/reviews/stars";
import { cx, Input } from "@/components/ui";
import type { PublicIndicator } from "@/lib/indicators";

export type IndicatorOffer = { code: string; price: string; suffix?: string; owned: boolean; rating?: { avg: number; count: number } };

const ALL = "ทั้งหมด";

export function IndicatorExplorer({ indicators, offers }: { indicators: PublicIndicator[]; offers: IndicatorOffer[] }) {
  const [family, setFamily] = useState<string>(ALL);
  const families = [ALL, ...new Set(indicators.map((i) => i.family))];
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const items = indicators.filter((i) => (family === ALL || i.family === family) && `${i.name} ${i.code} ${i.description}`.toLowerCase().includes(q));
  const count = (f: string) => (f === ALL ? indicators.length : indicators.filter((i) => i.family === f).length);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-line bg-panel p-2 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="กรองตามกลยุทธ์" className="flex flex-wrap gap-1">
          {families.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={family === f}
              onClick={() => setFamily(f)}
              className={cx(
                "inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors",
                family === f ? "bg-fg text-ink" : "text-muted hover:bg-panel-3 hover:text-fg",
              )}
            >
              {f}
              <span className={cx("num rounded-md px-1.5 text-xs", family === f ? "bg-ink/15" : "bg-panel-3")}>{count(f)}</span>
            </button>
          ))}
        </div>
        <label className="relative sm:w-72">
          <span className="sr-only">ค้นหาอินดิเคเตอร์</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อหรือรหัส เช่น OB" className="h-11 pl-10" />
        </label>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <li key={i.code} className="flex">
            <IndicatorCard indicator={i} offer={offers.find((o) => o.code === i.code)} />
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="mt-6 text-sm text-muted">
        {items.length ? `แสดง ${items.length} จาก ${indicators.length} อินดิเคเตอร์` : "ไม่พบอินดิเคเตอร์ ลองเปลี่ยนคำค้นหาหรือประเภท"}
      </p>
    </>
  );
}

/** Product card for one indicator. The whole card is a single link to its detail page. */
export function IndicatorCard({ indicator: i, offer }: { indicator: PublicIndicator; offer?: IndicatorOffer }) {
  const reference = i.is_reference || i.modes.length === 0;
  return (
    <Link
      href={`/indicators/${i.code}`}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-panel transition-[border-color,box-shadow,translate] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_24px_60px_-30px_rgb(0_0_0/0.6)]"
    >
      <div className="flex items-start gap-3.5 p-5 pb-4">
        <span aria-hidden className="num grid size-12 shrink-0 place-items-center rounded-xl border border-brand/30 bg-brand-dim text-sm font-bold text-accent">{i.code}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-snug font-semibold">{i.name}</h3>
          <p className="mt-0.5 text-sm text-muted">{i.family} · {reference ? "ข้อมูลอ้างอิง" : `เข้าแบบ ${i.modes.join(" / ")}`}</p>
        </div>
        {offer?.owned && <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-buy/30 bg-buy-dim px-2 py-0.5 text-xs font-medium text-buy"><BadgeCheck aria-hidden className="size-3.5" />มีสิทธิ์</span>}
      </div>

      {i.image_url && (
        <div className="mx-5 overflow-hidden rounded-xl border border-line bg-panel-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded image from Supabase Storage */}
          <img src={i.image_url} alt={`ภาพ ${i.name} บนกราฟ TradingView`} loading="lazy" className="aspect-video w-full object-cover" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 pt-4">
        <RatingSummary avg={offer?.rating?.avg} count={offer?.rating?.count} />
        <p className="mt-2 line-clamp-2 min-h-[3.4em] text-sm leading-relaxed text-muted">{i.description}</p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-xs text-muted">{offer?.suffix ? "ราคาเริ่มต้น" : "ราคา"}</p>
            <p className="mt-0.5 font-semibold">
              <span className="num text-lg">{offer?.price ?? "—"}</span>
              {offer?.suffix && <span className="ml-1 text-sm font-normal text-muted">{offer.suffix}</span>}
            </p>
          </div>
          <span className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line-strong px-3.5 text-sm font-medium transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-white">
            ดูรายละเอียด <ArrowRight aria-hidden className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
