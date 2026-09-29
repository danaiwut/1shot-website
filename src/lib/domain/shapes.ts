// Chart shapes from the trailing "#S" alert line, ported from tvaccess/tv_shapes.py.
//   #S B,acc,1789700000,1789712600,4386.5,4379.4,Accumulation 07;L,cisd,1789712900,1789719000,4384.2,CISD
//   B = box  B,style,t1,t2,p1,p2,label   ·  L = line L,style,t1,t2,price,label  ·  P = sloped line
//   t = unix seconds · t2 = 0 means "still open" (extended until TP/SL/close).

type BoxStyle = { fill: string; stroke: string; labelColor: string; labelPos?: string; dashed?: boolean };
type LineStyle = { color: string; style: "solid" | "dashed"; width: number; labelSide: string };

const BOX: Record<string, BoxStyle> = {
  acc: { fill: "rgba(33,150,243,.15)", stroke: "rgba(33,150,243,.7)", labelColor: "#000", labelPos: "inside" },
  man: { fill: "rgba(242,54,69,.20)", stroke: "rgba(242,54,69,.7)", labelColor: "#000", labelPos: "above" },
  man_lo: { fill: "rgba(242,54,69,.20)", stroke: "rgba(242,54,69,.7)", labelColor: "#000", labelPos: "below" },
  man_hi: { fill: "rgba(242,54,69,.20)", stroke: "rgba(242,54,69,.7)", labelColor: "#000", labelPos: "above" },
  dis: { fill: "rgba(76,175,80,.15)", stroke: "rgba(76,175,80,.7)", labelColor: "#000", labelPos: "inside" },
  fvg: { fill: "rgba(255,255,255,0)", stroke: "#7B1FA2", labelColor: "#7B1FA2", labelPos: "right", dashed: true },
  zone_d: { fill: "rgba(8,153,129,.5)", stroke: "rgba(8,153,129,.9)", labelColor: "#000", labelPos: "inside" },
  zone_s: { fill: "rgba(242,54,69,.5)", stroke: "rgba(242,54,69,.9)", labelColor: "#000", labelPos: "inside" },
  box: { fill: "rgba(0,0,0,.06)", stroke: "#333", labelColor: "#333" },
};

const LINE: Record<string, LineStyle> = {
  structure: { color: "#333333", style: "solid", width: 1.5, labelSide: "center" },
  cisd: { color: "#000000", style: "solid", width: 2, labelSide: "right" },
  sl: { color: "#F23645", style: "dashed", width: 1, labelSide: "right" },
  ent: { color: "#2196F3", style: "dashed", width: 1, labelSide: "right" },
  tp: { color: "#4CAF50", style: "dashed", width: 1, labelSide: "right" },
  lq: { color: "#3FB950", style: "dashed", width: 1, labelSide: "end" },
  neck: { color: "#d97706", style: "dashed", width: 1, labelSide: "end" },
  line: { color: "#333333", style: "solid", width: 1.5, labelSide: "end" },
};

const MAX_ITEMS = 40;

export type ShapeBox = BoxStyle & { t1: number; t2: number | null; p1: number; p2: number; label: string; style_id: string };
export type ShapeLine = LineStyle & { t1: number; t2: number | null; price: number; price2?: number; label: string; style_id: string };
export type Shapes = { boxes: ShapeBox[]; lines: ShapeLine[] };

function num(x: string | undefined): number | null {
  if (x === undefined) return null;
  const s = x.replace(/,/g, "").trim();
  if (s === "") return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

/** Python int(float(x)); throws on garbage so the item is skipped. */
function int(x: string | undefined): number {
  const v = Number((x ?? "").trim());
  if ((x ?? "").trim() === "" || !Number.isFinite(v)) throw new Error("bad int");
  return Math.trunc(v);
}

export function parseShapes(payload: string): Shapes | null {
  const boxes: ShapeBox[] = [];
  const lines: ShapeLine[] = [];
  for (const piece of payload.split(";")) {
    const raw = piece.trim();
    if (!raw) continue;
    const f = raw.split(",");
    const kind = f[0].trim().toUpperCase();
    try {
      if (kind === "B" && f.length >= 6) {
        const st = f[1].trim().toLowerCase();
        const t1 = int(f[2]), t2 = int(f[3]), p1 = num(f[4]), p2 = num(f[5]);
        if (!t1 || p1 === null || p2 === null) continue;
        boxes.push({ t1, t2: t2 || null, p1, p2, label: f.slice(6).join(",").trim(), ...(BOX[st] ?? BOX.box), style_id: st });
      } else if (kind === "P" && f.length >= 6) {
        const st = f[1].trim().toLowerCase();
        const t1 = int(f[2]), t2 = int(f[3]), price = num(f[4]), price2 = num(f[5]);
        if (t1 <= 0 || t2 <= t1 || price === null || price2 === null) continue;
        lines.push({ t1, t2, price, price2, label: f.slice(6).join(",").trim(), ...(LINE[st] ?? LINE.line), style_id: st });
      } else if (kind === "L" && f.length >= 5) {
        const st = f[1].trim().toLowerCase();
        const t1 = int(f[2]), t2 = int(f[3]), price = num(f[4]);
        if (!t1 || price === null) continue;
        lines.push({ t1, t2: t2 || null, price, label: f.slice(5).join(",").trim(), ...(LINE[st] ?? LINE.line), style_id: st });
      }
    } catch {
      continue;
    }
    if (boxes.length + lines.length >= MAX_ITEMS) break;
  }
  if (!boxes.length && !lines.length) return null;
  return { boxes, lines };
}

/** Strip the "#S" line from an alert: returns [clean text, shapes | null]. */
export function splitShapes(text: string): [string, Shapes | null] {
  const t = text ?? "";
  const m = /^[ \t]*#S[ \t]+(.*)$/m.exec(t);
  if (!m) return [t, null];
  const shapes = parseShapes(m[1]);
  const clean = (t.slice(0, m.index) + t.slice(m.index + m[0].length)).trimEnd();
  return [clean, shapes];
}

/** '5m' / '1H' / '15' / 'D' → seconds per bar (unknown = 300). */
export function tfSeconds(tf: string | null | undefined): number {
  const s = String(tf ?? "").trim().toLowerCase();
  const m = /^(\d+)\s*([a-z]*)$/.exec(s);
  if (m) {
    const n = Number.parseInt(m[1], 10);
    const u = m[2];
    if (["", "m", "min"].includes(u)) return n * 60;
    if (["h", "hr"].includes(u)) return n * 3600;
    if (["d", "day"].includes(u)) return n * 86400;
    if (u === "w") return n * 604800;
    if (["s", "sec"].includes(u)) return n;
  }
  if (["d", "1d", "day"].includes(s)) return 86400;
  if (["w", "1w"].includes(s)) return 604800;
  return 300;
}
