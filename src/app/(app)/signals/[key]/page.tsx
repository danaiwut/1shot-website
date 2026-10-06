import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SideBadge, StatusBadge } from "@/components/signals/badges";
import { LiveRefresh } from "@/components/signals/live-refresh";
import { PriceLadder } from "@/components/signals/price-ladder";
import { ZoneMap } from "@/components/signals/zone-map";
import { Badge, Card, CardHeader } from "@/components/ui";
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

  return (
    <>
      <Link href="/signals" className="mb-5 inline-flex underline-offset-4 hover:underline items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" /> กลับไปหน้าสัญญาณ</Link>
      <PageHeader
        eyebrow={`${setup.code} · ${setup.indicator}`}
        title={<span className="flex flex-wrap items-center gap-3">{setup.setup_name} <SideBadge side={setup.side} /> <StatusBadge status={setup.status} terminal={setup.terminal} /></span>}
        description={<span className="num">{setup.symbol} · TF {setup.timeframe} · {setup.mode ?? "—"} · เปิดเมื่อ {fmtDateTime(setup.opened_at)}</span>}
        action={!setup.terminal ? <LiveRefresh filter={`setup_key=eq.${key}`} /> : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader title="ระดับราคา" hint="ตามที่อินดิเคเตอร์ส่งมา ณ ตอนเกิด Setup" />
          <div className="px-4 pt-6 pb-10 sm:px-5"><PriceLadder side={setup.side} entry={setup.entry} sl={setup.sl} tp={setup.tp} exit={setup.exit_price} /></div>
          <dl className="grid grid-cols-2 border-t border-line text-sm">
            <Meta k="Risk : Reward" v={r !== null ? `1 : ${r}` : "—"} />
            <Meta k="ราคาออก" v={fmtPrice(setup.exit_price)} />
            <Meta k="ระยะ SL" v={setup.entry && setup.sl ? fmtPrice(Math.abs(setup.entry - setup.sl)) : "—"} />
            <Meta k="จำนวนเหตุการณ์" v={String(setup.events)} />
          </dl>
        </Card>

        <div className="space-y-6">
          {shapes && (
            <Card>
              <CardHeader title="โซนจากอินดิเคเตอร์" hint="กล่องและเส้นที่อินดิเคเตอร์วาด ไม่ใช่กราฟแท่งเทียน" />
              <div className="overflow-x-auto p-3 sm:p-4"><ZoneMap shapes={shapes} entry={setup.entry} sl={setup.sl} tp={setup.tp} endAt={endAt} /></div>
            </Card>
          )}
          <Card>
            <CardHeader title="ไทม์ไลน์" />
            <ol className="relative px-5 py-5">
              <span aria-hidden className="absolute top-7 bottom-7 left-[27px] w-px bg-line-strong" />
              {timeline.map((e) => {
                const s = STATUS_LABEL[e.kind] ?? STATUS_LABEL.info;
                return (
                  <li key={e.id} className="relative flex gap-4 py-2.5 pl-0">
                    <span aria-hidden className={`relative z-10 mt-1 size-3 shrink-0 rounded-full border-2 border-panel ${dot(s.tone)}`} />
                    <div className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{e.event} <Badge tone={s.tone} className="ml-1.5">{s.label}</Badge></p>
                        <p className="num mt-0.5 text-xs text-muted">
                          {e.exit_price != null ? `ราคา ${fmtPrice(e.exit_price)}` : e.entry != null ? `Entry ${fmtPrice(e.entry)}` : ""}
                        </p>
                      </div>
                      <time className="text-xs text-faint sm:text-xs">{fmtDateTime(e.observed_at)}</time>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>
      <p className="mt-8 text-xs text-faint">ราคาทั้งหมดเป็นระดับที่อินดิเคเตอร์รายงาน ไม่ใช่ราคาที่โบรกเกอร์ fill จริง</p>
    </>
  );
}

const dot = (tone: string) =>
  ({ brand: "bg-brand", buy: "bg-buy", sell: "bg-sell", info: "bg-info", neutral: "bg-faint" })[tone] ?? "bg-faint";

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-line px-5 py-3 odd:border-r [&:nth-child(-n+2)]:border-b">
      <dt className="text-xs text-faint">{k}</dt>
      <dd className="num mt-0.5">{v}</dd>
    </div>
  );
}
