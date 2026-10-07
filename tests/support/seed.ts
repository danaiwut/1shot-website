import { splitShapes } from "../../src/lib/domain/shapes";

// Sample data for the in-memory test database. Every name, account and price here is invented.

export const DEMO_OWNER_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_MEMBER_ID = "00000000-0000-4000-8000-000000000002";

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

  // Store. Prices are placeholders for the mockup — set real ones in Admin → สินค้าและราคา.
  const products: Row[] = [];
  const product_prices: Row[] = [];
  let pid = 1;
  const uuid = (prefix: string, n: number) => `${prefix}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const addProduct = (p: { name: string; description: string; kind: "single" | "bundle" | "pick"; codes: string[]; features?: string[]; featured?: boolean; sort: number; pick_count?: number; audience?: "all" | "returning"; badge?: string; available_until?: string }, prices: [string, number, string | null, number | null][]) => {
    const id = uuid("10", pid++);
    products.push({ id, features: [], featured: false, active: true, pick_count: null, audience: "all", badge: null, available_until: null, created_at: iso(now - 60 * D), updated_at: iso(now - 60 * D), ...p });
    prices.forEach(([billing, baht, interval, days], i) => product_prices.push({
      id: uuid("20", product_prices.length + 1), product_id: id, billing, amount_satang: baht * 100, currency: "thb",
      interval, duration_days: days, active: true, sort: i, created_at: iso(now - 60 * D),
    }));
    return id;
  };
  const allCodes = INDICATORS.filter((i) => !i.is_reference).map((i) => String(i.code));
  const ALL = addProduct({
    name: "All Access", kind: "bundle", codes: allCodes, featured: true, sort: 10,
    description: "ปลดล็อกอินดิเคเตอร์ 1SHOT ครบทุกตัว พร้อมห้องสัญญาณ Telegram ทุกห้อง",
    features: ["อินดิเคเตอร์ครบ 9 ตัว", "ห้องสัญญาณ Telegram ทุกห้อง", "สัญญาณใหม่แบบเรียลไทม์", "ได้อินดิเคเตอร์ตัวใหม่อัตโนมัติ"],
  }, [["subscription", 2990, "month", null], ["subscription", 29900, "year", null], ["one_time", 59000, null, null]]);
  const ICT = addProduct({
    name: "ICT Pack", kind: "bundle", codes: ["AMD", "AR", "OB", "SW"], sort: 20,
    description: "ชุดอินดิเคเตอร์สาย ICT สำหรับเทรดตามสภาพคล่องและ Orderblock",
    features: ["AMD Pro · Asian Range · Orderblock · Sweep Model", "ห้องสัญญาณของแต่ละตัว"],
  }, [["subscription", 1990, "month", null], ["one_time", 4990, null, 90]]);
  addProduct({
    name: "SMC + Supply & Demand", kind: "bundle", codes: ["DT", "TF", "SD"], sort: 30,
    description: "สาย SMC และ Supply/Demand สำหรับเทรดระหว่างวันและตามเทรนด์",
    features: ["Daytrade X · Trend Final · Supply and Demand", "เป้า TP หลายระดับ (R)"],
  }, [["subscription", 1590, "month", null], ["one_time", 3990, null, 90]]);
  addProduct({
    name: "โปรเดือนนี้: เลือก 2 อินดิเคเตอร์", kind: "pick", codes: ["DT", "RP", "TF", "AMD", "SW"], pick_count: 2, featured: true, badge: "HOT", sort: 5,
    available_until: iso(now + 20 * D), description: "รับทันที 2 อินดิเคเตอร์ ใช้งานตลอดชีพ",
    features: ["ใช้งานตลอดชีพ", "เข้ากลุ่ม OpenChat Community", "คลิปสอนการใช้งาน"],
  }, [["one_time", 15000, null, null]]);
  addProduct({
    name: "ลูกค้าเก่า: ราคาแยกเดี่ยวพิเศษ", kind: "pick", codes: ["DT", "RP", "TF", "AMD", "SW", "SD"], pick_count: 1, audience: "returning", badge: "HOT", sort: 6,
    available_until: iso(now + 20 * D), description: "สำหรับลูกค้าที่เคยซื้อแล้ว",
  }, [["one_time", 8495, null, null]]);
  addProduct({
    name: "คู่ ICT: AMD Pro + Sweep", kind: "bundle", codes: ["AMD", "SW"], badge: "คู่แนะนำ", sort: 7,
    description: "ดูวัฏจักร AMD แล้วเข้าเทรดตามจังหวะกวาด Liquidity",
  }, [["one_time", 16999, null, null]]);
  const singles: Record<string, string> = {};
  INDICATORS.filter((i) => !i.is_reference).forEach((ind, i) => {
    singles[String(ind.code)] = addProduct(
      { name: String(ind.name), kind: "single", codes: [String(ind.code)], sort: 100 + i, description: String(ind.description) },
      [["subscription", 790, "month", null], ["one_time", 1990, null, 90], ["one_time", 14000, null, null]],
    );
  });

  const priceOf = (productId: string, billing: string, days: number | null = null) =>
    product_prices.find((p) => p.product_id === productId && p.billing === billing && (billing === "subscription" || p.duration_days === days))!;
  let oid = 1;
  const order = (user_id: string, productId: string, billing: string, days: number | null, status: string, daysAgo: number, extra: Row = {}): Row => {
    const product = products.find((p) => p.id === productId)!;
    const price = priceOf(productId, billing, days);
    return {
      id: uuid("30", oid++), user_id, product_id: productId, price_id: price.id, product_name: product.name, codes: product.codes,
      billing, interval: price.interval, duration_days: price.duration_days, amount_satang: price.amount_satang, currency: "thb",
      status, kind: "checkout", stripe_checkout_session_id: `cs_mock_${oid}`, stripe_payment_intent_id: status === "paid" ? `pi_mock_${oid}` : null,
      stripe_subscription_id: null, stripe_invoice_id: null, receipt_url: null, access_until: null,
      created_at: iso(now - daysAgo * D), paid_at: status === "paid" || status === "refunded" ? iso(now - daysAgo * D + 60e3) : null, ...extra,
    };
  };
  const SW_SUB = "sub_mock_member_sw";
  const orders: Row[] = [
    order(DEMO_MEMBER_ID, singles.OB, "one_time", 90, "paid", 65, { access_until: iso(now + 25 * D) }),
    order(DEMO_MEMBER_ID, singles.SD, "one_time", null, "paid", 40),
    order(DEMO_MEMBER_ID, singles.SW, "subscription", null, "paid", 48, { stripe_subscription_id: SW_SUB }),
    order(DEMO_MEMBER_ID, singles.SW, "subscription", null, "paid", 18, { stripe_subscription_id: SW_SUB, kind: "renewal", stripe_checkout_session_id: null }),
    order(DEMO_MEMBER_ID, singles.AMD, "one_time", 90, "paid", 93),
    order(DEMO_MEMBER_ID, ICT, "subscription", null, "canceled", 5, { stripe_payment_intent_id: null }),
    order("00000000-0000-4000-8000-000000000006", singles.TF, "one_time", 90, "paid", 50),
    order("00000000-0000-4000-8000-000000000006", singles.RC, "one_time", 90, "paid", 50),
    order("00000000-0000-4000-8000-000000000007", ALL, "subscription", null, "failed", 2, { stripe_payment_intent_id: null }),
    order("00000000-0000-4000-8000-000000000003", ICT, "one_time", 90, "refunded", 12),
    order("00000000-0000-4000-8000-000000000005", ALL, "subscription", null, "pending", 0.1, { stripe_payment_intent_id: null }),
  ];
  // What each paid order added, so refunding a sample order takes the matching access back.
  for (const o of orders) {
    if (o.status !== "paid" || (o.stripe_subscription_id && o.kind === "checkout")) continue;
    o.grants = (o.codes as string[]).map((code) => {
      const r = indicator_rights.find((x) => x.user_id === o.user_id && x.code === code);
      return { code, had: false, before: null, after: r ? ((r.expires_at as string | null) ?? null) : iso(now), at: o.paid_at };
    });
  }
  const subscriptions: Row[] = [{
    id: SW_SUB, user_id: DEMO_MEMBER_ID, product_id: singles.SW, price_id: priceOf(singles.SW, "subscription").id, product_name: "Sweep Model",
    codes: ["SW"], status: "active", interval: "month", amount_satang: 79000, current_period_end: iso(now + 12 * D),
    cancel_at_period_end: false, created_at: iso(now - 48 * D), updated_at: iso(now - 18 * D),
  }];

  return {
    profiles, indicators: INDICATORS, indicator_rights, signal_events, telegram_links,
    telegram_link_tokens: [] as Row[], telegram_invites: [] as Row[], daily_briefs, news_items, webhook_receipts,
    products, product_prices, orders, subscriptions, stripe_customers: [] as Row[], stripe_events: [] as Row[], email_log: [] as Row[],
  };
}
