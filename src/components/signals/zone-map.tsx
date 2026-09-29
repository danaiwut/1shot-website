import type { Shapes } from "@/lib/domain/shapes";
import { fmtPrice } from "@/lib/format";

/**
 * Draws the indicator's own boxes/lines (from the alert "#S" line) on a time × price plane.
 * There is no candle feed yet, so this shows the zones only — not price action.
 */
export function ZoneMap({ shapes, entry, sl, tp, endAt }: { shapes: Shapes; entry: number | null; sl: number | null; tp: number | null; endAt: number }) {
  const W = 720, H = 300, padL = 8, padR = 72, padY = 16;
  const times: number[] = [];
  const prices: number[] = [];
  for (const b of shapes.boxes) { times.push(b.t1, b.t2 ?? endAt); prices.push(b.p1, b.p2); }
  for (const l of shapes.lines) { times.push(l.t1, l.t2 ?? endAt); prices.push(l.price, l.price2 ?? l.price); }
  for (const p of [entry, sl, tp]) if (p) prices.push(p);
  if (!times.length) return null;

  const t0 = Math.min(...times), t1 = Math.max(...times, t0 + 60);
  const pMax = Math.max(...prices), pMin = Math.min(...prices);
  const pad = (pMax - pMin) * 0.08 || 1;
  const hi = pMax + pad, lo = pMin - pad;
  const x = (t: number) => padL + ((t - t0) / (t1 - t0)) * (W - padL - padR);
  const y = (p: number) => padY + ((hi - p) / (hi - lo)) * (H - padY * 2);
  const levels = [
    { p: tp, c: "var(--color-buy)", l: "TP" },
    { p: entry, c: "var(--color-gold)", l: "Entry" },
    { p: sl, c: "var(--color-sell)", l: "SL" },
  ].filter((v): v is { p: number; c: string; l: string } => Boolean(v.p));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="แผนที่โซนของอินดิเคเตอร์">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={padL} x2={W - padR} y1={padY + f * (H - padY * 2)} y2={padY + f * (H - padY * 2)} stroke="rgb(255 255 255 / .05)" />
      ))}
      {shapes.boxes.map((b, i) => {
        const bx = x(b.t1), bw = Math.max(2, x(b.t2 ?? endAt) - bx);
        const by = y(Math.max(b.p1, b.p2)), bh = Math.max(2, Math.abs(y(b.p1) - y(b.p2)));
        return (
          <g key={`b${i}`}>
            <rect x={bx} y={by} width={bw} height={bh} rx="2" fill={b.fill} stroke={b.stroke} strokeDasharray={b.dashed ? "4 3" : undefined} />
            {b.label && <text x={bx + 6} y={by + 13} fontSize="11" fill="rgb(236 232 223 / .85)">{b.label}</text>}
          </g>
        );
      })}
      {shapes.lines.map((l, i) => {
        const color = l.color === "#000000" || l.color === "#333333" ? "rgb(236 232 223 / .7)" : l.color;
        return (
          <g key={`l${i}`}>
            <line x1={x(l.t1)} x2={x(l.t2 ?? endAt)} y1={y(l.price)} y2={y(l.price2 ?? l.price)} stroke={color} strokeWidth={l.width} strokeDasharray={l.style === "dashed" ? "5 4" : undefined} />
            {l.label && <text x={x(l.t2 ?? endAt) - 4} y={y(l.price2 ?? l.price) - 4} fontSize="10" textAnchor="end" fill={color}>{l.label}</text>}
          </g>
        );
      })}
      {levels.map((v) => (
        <g key={v.l}>
          <line x1={padL} x2={W - padR} y1={y(v.p)} y2={y(v.p)} stroke={v.c} strokeOpacity=".55" strokeDasharray="2 4" />
          <rect x={W - padR + 4} y={y(v.p) - 9} width={padR - 6} height="18" rx="4" fill={v.c} fillOpacity=".16" />
          <text x={W - padR + 8} y={y(v.p) + 4} fontSize="10.5" fill={v.c} fontFamily="var(--font-mono)">{fmtPrice(v.p)}</text>
        </g>
      ))}
    </svg>
  );
}
