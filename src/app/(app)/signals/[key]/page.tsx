import { notFound } from "next/navigation";
import { BackLink, EmptyLine, Section, StatRow } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { SideBadge, StatusBadge } from "@/components/signals/badges";
import { LiveRefresh } from "@/components/signals/live-refresh";
import { PriceLadder } from "@/components/signals/price-ladder";
import { ZoneMap } from "@/components/signals/zone-map";
import { Badge } from "@/components/ui";
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
      <BackLink href="/signals">กลับไปหน้าสัญญาณ</BackLink>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-x-3 gap-y-2">{setup.setup_name} <SideBadge side={setup.side} /> <StatusBadge status={setup.status} terminal={setup.terminal} /></span>}
        description={<span className="num">{setup.code} · {setup.indicator} · {setup.symbol} · TF {setup.timeframe} · {setup.mode ?? "—"} · เปิดเมื่อ {fmtDateTime(setup.opened_at)}</span>}
        action={!setup.terminal ? <LiveRefresh filter={`setup_key=eq.${key}`} /> : undefined}
      />

      <div className="space-y-10">
        <StatRow
          items={[
            { label: "Entry", value: fmtPrice(setup.entry) },
            { label: "SL", value: <span className="text-sell">{fmtPrice(setup.sl)}</span>, hint: setup.entry && setup.sl ? `ห่าง ${fmtPrice(Math.abs(setup.entry - setup.sl))}` : undefined },
            { label: "TP", value: <span className="text-buy">{fmtPrice(setup.tp)}</span> },
            { label: "Risk : Reward", value: r !== null ? `1 : ${r}` : "—", hint: setup.exit_price != null ? `ราคาออก ${fmtPrice(setup.exit_price)}` : undefined },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-start">
          <Section title="ระดับราคา" description="ตามที่อินดิเคเตอร์ส่งมา ณ ตอนเกิด Setup">
            <div className="px-4 pt-5 pb-10 sm:px-5">
              <PriceLadder side={setup.side} entry={setup.entry} sl={setup.sl} tp={setup.tp} exit={setup.exit_price} />
            </div>
          </Section>

          <div className="space-y-10">
            {shapes && (
              <Section title="โซนจากอินดิเคเตอร์" description="กล่องและเส้นที่อินดิเคเตอร์วาด ไม่ใช่กราฟแท่งเทียน">
                <div className="overflow-x-auto p-4 sm:p-5"><ZoneMap shapes={shapes} entry={setup.entry} sl={setup.sl} tp={setup.tp} endAt={endAt} /></div>
              </Section>
            )}
            <Section title="ไทม์ไลน์" description={timeline.length ? `${timeline.length} เหตุการณ์ เรียงจากเก่าไปใหม่` : undefined}>
              {timeline.length ? (
                <ol className="divide-y divide-line">
                  {timeline.map((e) => {
                    const s = STATUS_LABEL[e.kind] ?? STATUS_LABEL.info;
                    const price = e.exit_price != null ? `ราคา ${fmtPrice(e.exit_price)}` : e.entry != null ? `Entry ${fmtPrice(e.entry)}` : "";
                    return (
                      <li key={e.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-5">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">{e.event} <Badge tone={s.tone}>{s.label}</Badge></p>
                          {price && <p className="num mt-0.5 text-sm text-muted">{price}</p>}
                        </div>
                        <time dateTime={e.observed_at} className="num text-sm text-muted tabular-nums">{fmtDateTime(e.observed_at)}</time>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <EmptyLine>ยังไม่มีเหตุการณ์</EmptyLine>
              )}
            </Section>
          </div>
        </div>

        <p className="text-sm text-muted">ราคาทั้งหมดเป็นระดับที่อินดิเคเตอร์รายงาน ไม่ใช่ราคาที่โบรกเกอร์ fill จริง · จำนวนเหตุการณ์ <span className="num">{setup.events}</span></p>
      </div>
    </>
  );
}
