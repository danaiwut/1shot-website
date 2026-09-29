import { splitShapes } from "../domain/shapes";

// Sample data for mockup mode. Every name, account and price here is invented.

export const DEMO_OWNER_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_MEMBER_ID = "00000000-0000-4000-8000-000000000002";
export const DEMO_ACCOUNTS = [
  { email: "admin@1shot.demo", role: "owner", note: "เห็นทุกหน้า รวมหน้าแอดมิน" },
  { email: "member@1shot.demo", role: "member", note: "สมาชิกทั่วไป เห็นเฉพาะสัญญาณที่มีสิทธิ์" },
] as const;

type Row = Record<string, unknown>;

/** Small deterministic PRNG so the sample data looks the same on every start. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const INDICATORS: Row[] = [
  ["DT", "Daytrade X", "SMC", "CHoCH/BOS พร้อมโซนเข้าแบบ Limit สำหรับเทรดระหว่างวัน", ["Limit"], "-1001900000010"],
  ["RP", "Reversal Patterns", "1SHOT", "รูปแบบกลับตัว สร้าง → Retest → TP/SL", ["Limit"], "-1001900000020"],
  ["AMD", "AMD Pro", "ICT", "Accumulation · Manipulation · Distribution", ["Market", "Limit"], "-1001900000030"],
  ["AR", "Asian Range", "ICT", "กรอบราคาช่วงเอเชียและการกวาดสภาพคล่อง", ["Market", "Limit"], null],
  ["OB", "Orderblock", "ICT", "Orderblock พร้อมยืนยันเข้าแบบ Market", ["Market"], "-1001900000050"],
  ["SW", "Sweep Model", "ICT", "กวาด Liquidity แล้วเข้าตาม CISD", ["Market"], "-1001900000060"],
  ["TF", "Trend Final", "SnD", "ตามเทรนด์ด้วยโซน Supply/Demand", ["Limit"], null],
  ["SD", "Supply and Demand", "SnD", "โซน Supply/Demand พร้อมเป้า TP หลายระดับ (R)", ["Limit"], "-1001900000080"],
  ["RC", "1SHOT RC - Confirmation", "1SHOT", "สัญญาณยืนยันเข้าแบบ Market", ["Market"], null],
  ["LV", "Period Levels", "1SHOT", "ระดับ PDH/PDL · PWH/PWL · PMH/PML และราคาเปิดรอบ", [], null],
].map(([code, name, family, description, modes, room], i) => ({
  code, name, family, description, modes, telegram_room_id: room, sort: (i + 1) * 10, is_reference: code === "LV",
}));

const SETUP_NAMES: Record<string, string[]> = {
  DT: ["CHoCH Short M5", "BOS Continuation"],
  RP: ["Double Bottom Retest", "Head & Shoulders"],
  AMD: ["Distribution Long", "Manipulation Sweep"],
  AR: ["Asian High Sweep", "Asian Range Break"],
  OB: ["Bullish Orderblock", "Bearish Orderblock H1"],
  SW: ["Sweep Low + CISD", "Sweep High + CISD"],
  TF: ["Trend Demand Zone", "Trend Supply Zone"],
  SD: ["Supply Zone 12", "Demand Zone 07"],
  RC: ["RC Confirmation Buy", "RC Confirmation Sell"],
};

// Lifecycle of each sample setup: statuses after the opening SETUP event.
const PATHS: string[][] = [
  [], ["entry"], ["entry", "tp"], ["entry", "sl"], ["retest"], ["entry", "tp"], ["cancel"], ["entry", "close"], ["expired"],
];
const EVENT_NAME: Record<string, string> = {
  pending: "SETUP", entry: "ENTRY", retest: "RETEST", tp: "TP", sl: "SL", cancel: "CANCEL", expired: "EXPIRED", close: "CLOSE",
};

export function buildSeed(now = Date.now()) {
  const rand = rng(20260929);
  const iso = (ms: number) => new Date(ms).toISOString();
  const H = 3600e3, D = 24 * H;

  const profiles: Row[] = [
    { id: DEMO_OWNER_ID, email: "admin@1shot.demo", display_name: "แอดมิน 1SHOT", role: "owner", tradingview_username: "oneshot_admin", exness_account: "10000001", ib_verified: true, created_at: iso(now - 120 * D) },
    { id: DEMO_MEMBER_ID, email: "member@1shot.demo", display_name: "สมชาย ใจดี", role: "member", tradingview_username: "somchai_fx", exness_account: "20481234", ib_verified: true, created_at: iso(now - 45 * D) },
    { id: "00000000-0000-4000-8000-000000000003", email: "nida.trader@example.com", display_name: "นิดา", role: "member", tradingview_username: "nida_gold", exness_account: "30917755", ib_verified: false, created_at: iso(now - 2 * D) },
    { id: "00000000-0000-4000-8000-000000000004", email: "kittipong@example.com", display_name: "กิตติพงษ์", role: "admin", tradingview_username: "kp_trade", exness_account: "40155620", ib_verified: true, created_at: iso(now - 90 * D) },
    { id: "00000000-0000-4000-8000-000000000005", email: "ploy.s@example.com", display_name: "พลอย", role: "member", tradingview_username: null, exness_account: null, ib_verified: false, created_at: iso(now - 6 * H) },
    { id: "00000000-0000-4000-8000-000000000006", email: "arthit.w@example.com", display_name: "อาทิตย์", role: "member", tradingview_username: "arthit_xau", exness_account: "50288341", ib_verified: true, created_at: iso(now - 20 * D) },
    { id: "00000000-0000-4000-8000-000000000007", email: "mint@example.com", display_name: null, role: "member", tradingview_username: "mint_scalper", exness_account: "60473319", ib_verified: false, created_at: iso(now - 9 * D) },
  ];

  const right = (user_id: string, code: string, days: number | null, note: string | null = null): Row => ({
    user_id, code, expires_at: days === null ? null : iso(now + days * D), note, granted_by: DEMO_OWNER_ID, updated_at: iso(now - 3 * D),
  });
  const indicator_rights: Row[] = [
    ...["DT", "RP", "AMD", "AR", "OB", "SW", "TF", "SD", "RC"].map((c) => right(DEMO_OWNER_ID, c, null)),
    right(DEMO_MEMBER_ID, "OB", 25), right(DEMO_MEMBER_ID, "SD", null, "VIP"), right(DEMO_MEMBER_ID, "SW", 12), right(DEMO_MEMBER_ID, "AMD", -3),
    right("00000000-0000-4000-8000-000000000004", "DT", null), right("00000000-0000-4000-8000-000000000004", "OB", null),
    right("00000000-0000-4000-8000-000000000006", "TF", 40), right("00000000-0000-4000-8000-000000000006", "RC", 40),
  ];

  const telegram_links: Row[] = [
    { user_id: DEMO_OWNER_ID, tg_uid: "700000001", tg_name: "Admin 1SHOT", tg_username: "oneshot_admin", linked_at: iso(now - 100 * D) },
    { user_id: DEMO_MEMBER_ID, tg_uid: "700000002", tg_name: "Somchai J.", tg_username: "somchai_fx", linked_at: iso(now - 40 * D) },
    { user_id: "00000000-0000-4000-8000-000000000004", tg_uid: "700000004", tg_name: "Kittipong", tg_username: "kp_trade", linked_at: iso(now - 80 * D) },
  ];

  // Signals: each setup is a SETUP event followed by the events in its path.
  const signal_events: Row[] = [];
  let id = 1;
  let price = 4380;
  let t = now - 3 * D;
  const codes = Object.keys(SETUP_NAMES);
  for (let n = 0; n < 22; n++) {
    const code = codes[n % codes.length];
    const ind = INDICATORS.find((i) => i.code === code)!;
    const side = rand() > 0.5 ? "BUY" : "SELL";
    const mode = (ind.modes as string[])[Math.floor(rand() * (ind.modes as string[]).length)];
    price = Math.round((price + (rand() - 0.5) * 18) * 2) / 2;
    const risk = Math.round((5 + rand() * 7) * 2) / 2;
    const reward = Math.round(risk * (1.5 + rand() * 2) * 4) / 4;
    const entry = price;
    const sl = side === "BUY" ? entry - risk : entry + risk;
    const tp = side === "BUY" ? entry + reward : entry - reward;
    const name = SETUP_NAMES[code][n % 2];
    const setup_key = `${code}|v3|OANDA:XAUUSD|5|${side}|${1000 + n}`;
    // Newest setups are still open, older ones have run their course.
    const path = n >= 18 ? PATHS[n % 2 === 0 ? 0 : 1] : n >= 15 ? PATHS[4] : PATHS[(n % (PATHS.length - 1)) + 1];
    t += (3 * D) / 24 + rand() * H;
    const opened = Math.min(t, now - (22 - n) * 4 * 60e3);

    const s = Math.floor(opened / 1000);
    const zoneLo = side === "BUY" ? entry - risk * 0.6 : entry;
    const zoneHi = side === "BUY" ? entry : entry + risk * 0.6;
    const shapeText = n % 3 === 0
      ? `#S B,${side === "BUY" ? "zone_d" : "zone_s"},${s - 5400},${s},${zoneHi},${zoneLo},${side === "BUY" ? "Demand" : "Supply"};L,structure,${s - 7200},${s - 1800},${side === "BUY" ? tp - reward * 0.4 : tp + reward * 0.4},BOS;L,cisd,${s - 2400},0,${entry},CISD`
      : "";
    const [, shapes] = shapeText ? splitShapes(shapeText) : [null, null];

    const base = { code, indicator: ind.name, side, mode, symbol: "OANDA:XAUUSD", feed_symbol: "XAUUSD", timeframe: "5", version: "v3", setup_id: setup_key, setup_key, setup_name: name, entry, sl, tp, reference: null };
    signal_events.push({ ...base, id: id++, kind: "pending", event: "SETUP", event_id: `${setup_key}:SETUP`, exit_price: null, terminal: false, observed_at: iso(opened), shapes });
    path.forEach((kind, i) => {
      const terminal = ["tp", "sl", "cancel", "expired", "close"].includes(kind);
      const exit_price = kind === "tp" ? tp : kind === "sl" ? sl : kind === "close" ? Math.round((entry + (tp - entry) * 0.4) * 100) / 100 : null;
      signal_events.push({
        ...base, id: id++, kind, event: EVENT_NAME[kind], event_id: `${setup_key}:${EVENT_NAME[kind]}`, exit_price, terminal,
        observed_at: iso(Math.min(opened + (i + 1) * (20 + rand() * 50) * 60e3, now - 60e3)), shapes: null,
      });
    });
  }

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(now));
  const yesterday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(now - D));
  const daily_briefs: Row[] = [
    {
      brief_date: today,
      story: "ทองคำเปิดตลาดเอเชียทรงตัวเหนือ 4,380 หลังดอลลาร์อ่อนค่าลงเล็กน้อย นักลงทุนรอดูตัวเลขเงินเฟ้อสหรัฐคืนนี้ ซึ่งอาจกำหนดทิศทางดอกเบี้ยรอบถัดไป\n\nแนวรับสำคัญอยู่ที่ 4,350 และ 4,320 ส่วนแนวต้านอยู่ที่ 4,410 หากผ่านได้มีโอกาสทดสอบ 4,450\n\nช่วงก่อนประกาศตัวเลข ความผันผวนอาจสูง ควรลดขนาดสัญญาและตั้ง SL ทุกครั้ง",
      facts: "DXY -0.3% (104.2)\nUS10Y 4.12%\nSPDR Gold Holdings +2.1 ตัน\nCPI สหรัฐ ประกาศ 19:30 น. (เวลาไทย)",
    },
    { brief_date: yesterday, story: "ทองคำปิดบวกเล็กน้อยจากแรงซื้อช่วงตลาดยุโรป", facts: "DXY +0.1%" },
  ];

  const news_items: Row[] = [
    ["Reuters", "Gold steadies ahead of US inflation data", "ทองคำทรงตัว รอตัวเลขเงินเฟ้อสหรัฐ", "หนุน: ตลาดคาดเฟดอาจลดดอกเบี้ยเร็วขึ้น", 1],
    ["Bloomberg", "Treasury yields climb as traders pare rate-cut bets", "บอนด์ยีลด์สหรัฐปรับขึ้น นักลงทุนลดคาดการณ์ลดดอกเบี้ย", "กดดัน: ยีลด์สูงขึ้นทำให้ทองน่าถือน้อยลง", 3],
    ["CNBC", "Central banks keep buying gold", "ธนาคารกลางทั่วโลกยังซื้อทองต่อเนื่อง", "หนุน: อุปสงค์ระยะยาวแข็งแรง", 5],
    ["Reuters", "Dollar slips against major currencies", "ดอลลาร์อ่อนค่าเทียบสกุลหลัก", "หนุน: ทองถูกลงสำหรับผู้ถือสกุลอื่น", 7],
    ["Financial Times", "Middle East tensions lift safe-haven demand", "ความตึงเครียดตะวันออกกลางหนุนความต้องการสินทรัพย์ปลอดภัย", "หนุน: แรงซื้อเพื่อหลบความเสี่ยง", 11],
    ["Bloomberg", "US jobs report beats expectations", "ตัวเลขจ้างงานสหรัฐออกมาดีกว่าคาด", "กดดัน: ลดโอกาสลดดอกเบี้ย", 20],
    ["Kitco", "Physical demand in Asia softens on high prices", "ความต้องการทองแท่งในเอเชียชะลอตัวจากราคาสูง", "เป็นกลาง: กระทบระยะสั้นเท่านั้น", 26],
  ].map(([source, title, title_th, gold_impact, h], i) => ({
    id: i + 1, source, title, title_th, gold_impact, link: `https://example.com/news/${i + 1}`, published_at: iso(now - (h as number) * H),
  }));

  const webhook_receipts: Row[] = [
    [true, 1, null, "[WF1]\nIndicator:SD\nEvent:SETUP\nSide:SELL\nEntry:4380\nSL:4390\nTP:4350\n[/WF1]", 2],
    [true, 1, null, "[WF1]\nIndicator:OB\nEvent:ENTRY\nSide:BUY\n[/WF1]", 9],
    [true, 0, null, "[WF1]\nIndicator:OB\nEvent:ENTRY\nSide:BUY\n[/WF1]", 9.5],
    [false, 0, "SL must be below Entry for BUY", "[WF1]\nIndicator:DT\nEvent:SETUP\nSide:BUY\nEntry:4380\nSL:4390\n[/WF1]", 31],
    [true, 2, null, "[WF1]\nIndicator:SW\nEvent:TP\n[/WF1]\n[WF1]\nIndicator:SW\nEvent:SUMMARY\n[/WF1]", 64],
    [false, 0, "missing [WF1] envelope", "Hello from TradingView", 180],
    [true, 1, null, "[WF1]\nIndicator:AMD\nEvent:SETUP\n[/WF1]", 240],
  ].map(([ok, inserted, error, excerpt, min], i) => ({
    id: i + 1, ok, inserted, error, excerpt, received_at: iso(now - (min as number) * 60e3),
  }));

  return {
    profiles, indicators: INDICATORS, indicator_rights, signal_events, telegram_links,
    telegram_link_tokens: [] as Row[], telegram_invites: [] as Row[], daily_briefs, news_items, webhook_receipts,
  };
}
