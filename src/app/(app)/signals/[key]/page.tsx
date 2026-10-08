import { notFound } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, History } from "lucide-react";
import { BackLink, CARD } from "@/components/app/kit";
import { EmptyState } from "@/components/app/toolbar";
import { Dot } from "@/components/brand";
import { sideTone, StatusBadge } from "@/components/signals/badges";
import { LiveRefresh } from "@/components/signals/live-refresh";
import { PriceLadder } from "@/components/signals/price-ladder";
import { ZoneMap } from "@/components/signals/zone-map";
import { Badge, cx } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDateTime, fmtPrice, rMultiple, STATUS_LABEL } from "@/lib/format";
import type { Setup, SignalEvent } from "@/lib/types";

/** Each signal gets its own page title (WCAG 2.4.2). */
export async function generateMetadata({ params }: PageProps<"/signals/[key]">) {
  const key = decodeURIComponent((await params).key);
  const { supabase } = await requireViewer();
  const { data } = await supabase.from("setups").select("code, setup_name, side").eq("setup_key", key).maybeSingle<Pick<Setup, "code" | "setup_name" | "side">>();
  return { title: data ? `${data.code} ${data.setup_name}${data.side ? ` ${data.side}` : ""} · สัญญาณ` : "รายละเอียดสัญญาณ" };
}

const DOT = { brand: "bg-brand", buy: "bg-buy", sell: "bg-sell", info: "bg-fg", neutral: "bg-line-strong" } as const;

export default async function SignalDetailPage({ params }: PageProps<"/signals/[key]">) {
  const key = decodeURIComponent((await params).key);
  const { supabase } = await requireViewer();
  const [{ data: setup }, { data: events }] = await Promise.all([
    supabase.from("setups").select("*").eq("setup_key", key).maybeSingle<Setup>(),
    supabase.from("signal_events").select("id,code,kind,event,side,mode,entry,sl,tp,exit_price,terminal,observed_at,shapes,reference").eq("setup_key", key).order("observed_at").order("id"),
  ]);
  if (!setup) notFound();
  const timeline = (events ?? []) as SignalEvent[];
  const shapes = [...timeline].reverse().find((e) => e.shapes)?.shapes ?? null;
  const r = rMultiple(setup.entry, setup.sl, setup.tp);
  const endAt = Math.floor(new Date(setup.updated_at).getTime() / 1000) + 30 * 60;
  const buy = setup.side === "BUY", sell = setup.side === "SELL";
  const SideIcon = sell ? ArrowDownRight : ArrowUpRight;

  const prices = [
    { k: "Entry", v: fmtPrice(setup.entry), tone: "" },
    { k: "SL", v: fmtPrice(setup.sl), tone: "text-sell", hint: setup.entry && setup.sl ? `ห่าง ${fmtPrice(Math.abs(setup.entry - setup.sl))}` : undefined },
    { k: "TP", v: fmtPrice(setup.tp), tone: "text-buy", hint: setup.entry && setup.tp ? `ห่าง ${fmtPrice(Math.abs(setup.tp - setup.entry))}` : undefined },
    { k: "Risk : Reward", v: r !== null ? `1 : ${r}` : "—", tone: "", hint: setup.exit_price != null ? `ราคาออก ${fmtPrice(setup.exit_price)}` : undefined },
  ];

  return (
    <div className="space-y-10">
      <div>
        <BackLink href="/signals">กลับไปหน้าสัญญาณ</BackLink>
        <header className="relative overflow-hidden rounded-3xl border border-line bg-ink dark:border-white/10 text-fg shadow-[0_30px_80px_-40px_rgb(178_0_22/0.35)] dark:shadow-[0_30px_80px_-40px_rgb(178_0_22/0.6)]">
          <span aria-hidden className={cx("absolute inset-x-0 top-0 h-1.5", buy ? "bg-buy" : sell ? "bg-sell" : "bg-line-strong")} />
          <div aria-hidden className={cx("pointer-events-none absolute -top-24 -right-16 size-96 rounded-full blur-[120px]", buy ? "bg-buy/15 dark:bg-buy/30" : "bg-brand/15 dark:bg-brand/40")} />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/4 size-72 rounded-full bg-brand/15 blur-[100px]" />

          <div className="relative px-6 pt-9 pb-6 sm:px-10 sm:pt-11">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="num text-sm font-bold tracking-[0.18em] text-accent uppercase">{setup.code} · {setup.indicator}</p>
                <h1 className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-3xl font-black tracking-tight sm:text-5xl">
                  {(buy || sell) && (
                    <span className={cx("num inline-flex items-center gap-1", sideTone(setup.side))}>
                      <SideIcon aria-hidden className="size-8 sm:size-11" strokeWidth={3} />{setup.side}
                    </span>
                  )}
                  <span className="min-w-0 break-words">{setup.setup_name}<Dot /></span>
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <StatusBadge status={setup.status} terminal={setup.terminal} className="px-3 py-1 text-sm" />
                  {[setup.symbol, `TF ${setup.timeframe}`, setup.mode ?? "—"].map((t, i) => (
                    <span key={i} className="num rounded-full border border-line px-3 py-1 text-muted">{t}</span>
                  ))}
                  <span className="text-muted">เปิดเมื่อ <time dateTime={setup.opened_at} className="num">{fmtDateTime(setup.opened_at)}</time></span>
                </div>
              </div>
              {!setup.terminal && <LiveRefresh filter={`setup_key=eq.${key}`} />}
            </div>
          </div>

          <dl className="relative grid grid-cols-2 gap-px border-t border-line bg-line lg:grid-cols-4">
            {prices.map((p) => (
              <div key={p.k} className="bg-ink/70 px-6 py-5 backdrop-blur sm:px-10">
                <dt className="text-xs font-bold tracking-[0.14em] text-muted uppercase">{p.k}</dt>
                <dd className={cx("num mt-2 text-2xl leading-none font-black tracking-tight tabular-nums sm:text-4xl", p.tone)}>{p.v}</dd>
                {p.hint && <dd className="num mt-2 text-sm text-muted">{p.hint}</dd>}
              </div>
            ))}
          </dl>
        </header>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] xl:items-start">
        <section aria-labelledby="ladder-title" className={cx(CARD, "p-5 sm:p-6")}>
          <h2 id="ladder-title" className="text-lg font-bold tracking-tight">ระดับราคา</h2>
          <p className="mt-0.5 text-sm text-muted">ตามที่อินดิเคเตอร์ส่งมา ณ ตอนเกิด Setup</p>
          <div className="mt-6 pb-10">
            <PriceLadder side={setup.side} entry={setup.entry} sl={setup.sl} tp={setup.tp} exit={setup.exit_price} />
          </div>
        </section>

        <div className="space-y-8">
          {shapes && (
            <section aria-labelledby="zone-title" className={cx(CARD, "p-5 sm:p-6")}>
              <h2 id="zone-title" className="text-lg font-bold tracking-tight">โซนจากอินดิเคเตอร์</h2>
              <p className="mt-0.5 text-sm text-muted">กล่องและเส้นที่อินดิเคเตอร์วาด ไม่ใช่กราฟแท่งเทียน</p>
              <div className="mt-5 overflow-x-auto rounded-xl bg-panel-2 p-3"><ZoneMap shapes={shapes} entry={setup.entry} sl={setup.sl} tp={setup.tp} endAt={endAt} /></div>
            </section>
          )}

          <section aria-labelledby="timeline-title" className={CARD}>
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <h2 id="timeline-title" className="text-lg font-bold tracking-tight">ไทม์ไลน์</h2>
              {timeline.length > 0 && <p className="mt-0.5 text-sm text-muted">{timeline.length} เหตุการณ์ เรียงจากเก่าไปใหม่</p>}
            </div>
            {timeline.length ? (
              <ol className="px-5 py-5 sm:px-6">
                {timeline.map((e, i) => {
                  const s = STATUS_LABEL[e.kind] ?? STATUS_LABEL.info;
                  const price = e.exit_price != null ? `ราคา ${fmtPrice(e.exit_price)}` : e.entry != null ? `Entry ${fmtPrice(e.entry)}` : "";
                  const last = i === timeline.length - 1;
                  return (
                    <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {!last && <span aria-hidden className="absolute top-5 bottom-0 left-[7px] w-0.5 bg-line" />}
                      <span aria-hidden className={cx("relative mt-1 size-4 shrink-0 rounded-full ring-4 ring-panel", DOT[s.tone], last && !setup.terminal && "animate-pulse-dot")} />
                      <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 font-semibold">{e.event} <Badge tone={s.tone}>{s.label}</Badge></p>
                          {price && <p className="num mt-0.5 text-sm font-semibold tabular-nums text-muted">{price}</p>}
                        </div>
                        <time dateTime={e.observed_at} className="num text-sm whitespace-nowrap text-muted tabular-nums">{fmtDateTime(e.observed_at)}</time>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyState icon={<History />} title="ยังไม่มีเหตุการณ์">เมื่ออินดิเคเตอร์ส่งอัปเดตของ Setup นี้ จะแสดงที่นี่ตามลำดับเวลา</EmptyState>
            )}
          </section>
        </div>
      </div>

      <p className="text-sm text-muted">ราคาทั้งหมดเป็นระดับที่อินดิเคเตอร์รายงาน ไม่ใช่ราคาที่โบรกเกอร์ fill จริง · จำนวนเหตุการณ์ <span className="num">{setup.events}</span></p>
    </div>
  );
}
