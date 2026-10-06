import { buildSeed } from "./seed";

/*
 * Test-only in-memory stand-in for the Supabase service-role client, covering exactly the query surface this app uses:
 * select (with the embedded relations below) / insert / update / upsert / delete, the filters
 * eq neq gt gte lt lte in is not ilike or, order / limit / range, single / maybeSingle, count,
 * the `setups` view and `ingest_signal_events`. Data lives for the life of the server process.
 */

type Row = Record<string, unknown>;
type Db = ReturnType<typeof buildSeed>;
type TableName = keyof Db | "setups";

const g = globalThis as unknown as { __mockDb?: Db; __mockSeq?: number };
function db(): Db {
  g.__mockDb ??= buildSeed();
  return g.__mockDb;
}
const nextId = () => (g.__mockSeq = (g.__mockSeq ?? 10_000) + 1);

const PRIMARY_KEYS: Record<string, string[]> = {
  profiles: ["id"], indicators: ["code"], indicator_rights: ["user_id", "code"], telegram_links: ["user_id"],
  telegram_link_tokens: ["user_id"], telegram_invites: ["invite_url"], daily_briefs: ["brief_date"],
  products: ["id"], product_prices: ["id"], orders: ["id"], subscriptions: ["id"], stripe_customers: ["user_id"], stripe_events: ["id"], email_log: ["id"],
};
const AUTO_ID = new Set(["signal_events", "news_items", "webhook_receipts", "email_log"]);
const AUTO_UUID = new Set(["products", "product_prices", "orders"]);

/** Mirrors the `public.setups` view: opening event + latest state per setup_key. */
function setupsView(events: Row[]): Row[] {
  const by = new Map<string, Row[]>();
  for (const e of events) {
    const k = String(e.setup_key);
    if (!by.has(k)) by.set(k, []);
    by.get(k)!.push(e);
  }
  const ts = (r: Row) => new Date(String(r.observed_at)).getTime();
  const out: Row[] = [];
  for (const [key, list] of by) {
    list.sort((a, b) => ts(a) - ts(b) || Number(a.id) - Number(b.id));
    const first = list.find((e) => e.kind !== "info");
    if (!first) continue;
    const last = list[list.length - 1];
    out.push({
      setup_key: key, code: first.code, indicator: first.indicator, setup_name: first.setup_name, setup_id: first.setup_id,
      mode: first.mode, side: first.side, symbol: first.symbol, timeframe: first.timeframe, entry: first.entry, sl: first.sl, tp: first.tp,
      opened_at: first.observed_at, status: last.kind, last_event: last.event, exit_price: last.exit_price, terminal: last.terminal,
      updated_at: last.observed_at, events: list.length,
    });
  }
  return out;
}

/** Embedded relations used by the pages' select strings, e.g. `*, indicators(name)`. */
function embed(table: string, rows: Row[], select: string, this_visible: (r: Row) => boolean = () => true): Row[] {
  const d = db();
  const wants = (rel: string) => new RegExp(`(^|[,\\s])${rel}(!\\w+)?\\(`).test(select);
  return rows.map((r) => {
    const o = { ...r };
    if (table === "indicator_rights" && wants("indicators")) o.indicators = d.indicators.find((i) => i.code === r.code) ?? null;
    if (table === "profiles" && wants("telegram_links")) o.telegram_links = d.telegram_links.find((l) => l.user_id === r.id) ?? null;
    if (table === "profiles" && wants("indicator_rights")) o.indicator_rights = d.indicator_rights.filter((x) => x.user_id === r.id);
    if (table === "products" && wants("product_prices")) {
      o.product_prices = d.product_prices.filter((p) => p.product_id === r.id && this_visible(p)).sort((a, b) => Number(a.sort) - Number(b.sort));
    }
    if ((table === "orders" || table === "subscriptions") && wants("profiles")) {
      const p = d.profiles.find((x) => x.id === r.user_id);
      o.profiles = p ? { email: p.email, display_name: p.display_name } : null;
    }
    return o;
  });
}

type Filter = (r: Row) => boolean;
const cmp = (a: unknown, b: unknown) => {
  if (typeof a === "number" || typeof b === "number") return Number(a) - Number(b);
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
};
const likeToRegex = (pattern: string) =>
  new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".")}$`, "i");

function opFilter(col: string, op: string, value: string): Filter {
  switch (op) {
    case "eq": return (r) => String(r[col]) === value;
    case "neq": return (r) => String(r[col]) !== value;
    case "ilike": { const re = likeToRegex(value); return (r) => re.test(String(r[col] ?? "")); }
    case "is": return (r) => (value === "null" ? r[col] == null : String(r[col]) === value);
    default: return () => true;
  }
}

class Query implements PromiseLike<{ data: unknown; error: null | { message: string; code?: string }; count: number | null }> {
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private selectStr = "*";
  private filters: Filter[] = [];
  private orders: { col: string; asc: boolean }[] = [];
  private limitN?: number;
  private rangeAB?: [number, number];
  private one?: "single" | "maybe";
  private wantCount = false;
  private payload: Row | Row[] = [];
  private conflictKeys?: string[];
  private ignoreDuplicates = false;

  constructor(private table: TableName, private visible: (table: string, r: Row) => boolean) {}

  select(cols = "*", opts?: { count?: string }) { this.selectStr = cols; if (opts?.count) this.wantCount = true; return this; }
  insert(rows: Row | Row[]) { this.op = "insert"; this.payload = rows; return this; }
  update(patch: Row) { this.op = "update"; this.payload = patch; return this; }
  upsert(rows: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.op = "upsert"; this.payload = rows;
    this.conflictKeys = opts?.onConflict?.split(",").map((k) => k.trim());
    this.ignoreDuplicates = Boolean(opts?.ignoreDuplicates);
    return this;
  }
  delete() { this.op = "delete"; return this; }

  eq(c: string, v: unknown) { this.filters.push((r) => String(r[c]) === String(v)); return this; }
  neq(c: string, v: unknown) { this.filters.push((r) => String(r[c]) !== String(v)); return this; }
  gt(c: string, v: unknown) { this.filters.push((r) => r[c] != null && cmp(r[c], v) > 0); return this; }
  gte(c: string, v: unknown) { this.filters.push((r) => r[c] != null && cmp(r[c], v) >= 0); return this; }
  lt(c: string, v: unknown) { this.filters.push((r) => r[c] != null && cmp(r[c], v) < 0); return this; }
  lte(c: string, v: unknown) { this.filters.push((r) => r[c] != null && cmp(r[c], v) <= 0); return this; }
  in(c: string, vs: unknown[]) { const s = new Set(vs.map(String)); this.filters.push((r) => s.has(String(r[c]))); return this; }
  is(c: string, v: null | boolean) { this.filters.push((r) => (v === null ? r[c] == null : r[c] === v)); return this; }
  not(c: string, op: string, v: unknown) { const f = opFilter(c, op, String(v)); this.filters.push((r) => !f(r)); return this; }
  ilike(c: string, p: string) { this.filters.push(opFilter(c, "ilike", p)); return this; }
  /** PostgREST `or` syntax: "col.op.value,col.op.value". */
  or(expr: string) {
    const parts = expr.split(",").map((p) => { const [col, op, ...rest] = p.split("."); return opFilter(col, op, rest.join(".")); });
    this.filters.push((r) => parts.some((f) => f(r)));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) { this.orders.push({ col, asc: opts?.ascending ?? true }); return this; }
  limit(n: number) { this.limitN = n; return this; }
  range(a: number, b: number) { this.rangeAB = [a, b]; return this; }
  single() { this.one = "single"; return this; }
  maybeSingle() { this.one = "maybe"; return this; }

  then<A = never, B = never>(ok?: ((v: Awaited<ReturnType<Query["run"]>>) => A | PromiseLike<A>) | null, fail?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return Promise.resolve().then(() => this.run()).then(ok, fail);
  }

  private match(r: Row) { return this.filters.every((f) => f(r)); }

  private run() {
    const d = db();
    if (this.table === "setups") return this.finish(setupsView(d.signal_events).filter((r) => this.visible("setups", r)));
    const table = d[this.table] as Row[];
    const now = new Date().toISOString();

    if (this.op === "insert" || this.op === "upsert") {
      const keys = this.conflictKeys ?? PRIMARY_KEYS[this.table];
      const written: Row[] = [];
      for (const input of Array.isArray(this.payload) ? this.payload : [this.payload]) {
        const row: Row = { ...input };
        const existing = this.op === "upsert" && keys ? table.find((r) => keys.every((k) => row[k] != null && String(r[k]) === String(row[k]))) : undefined;
        if (existing) {
          if (this.ignoreDuplicates) continue;
          Object.assign(existing, row, "updated_at" in existing ? { updated_at: now } : {});
          written.push(existing);
          continue;
        }
        if (AUTO_ID.has(this.table) && row.id == null) row.id = nextId();
        if (AUTO_UUID.has(this.table) && row.id == null) row.id = crypto.randomUUID();
        if (this.table === "webhook_receipts") row.received_at ??= now;
        if (["orders", "products", "product_prices", "subscriptions", "stripe_customers", "email_log"].includes(this.table)) row.created_at ??= now;
        table.push(row);
        written.push(row);
      }
      return this.finish(written);
    }
    const hits = table.filter((r) => this.match(r));
    if (this.op === "update") {
      for (const r of hits) Object.assign(r, this.payload, "updated_at" in r ? { updated_at: now } : {});
      return this.finish(hits, true);
    }
    if (this.op === "delete") {
      for (const r of hits) table.splice(table.indexOf(r), 1);
      return this.finish(hits, true);
    }
    return this.finish(table.filter((r) => this.visible(this.table, r)));
  }

  private finish(rows: Row[], filtered = false) {
    let out = filtered || this.op !== "select" ? rows : rows.filter((r) => this.match(r));
    const count = this.wantCount ? out.length : null;
    for (const { col, asc } of [...this.orders].reverse()) {
      out = [...out].sort((a, b) => (a[col] == null ? 1 : b[col] == null ? -1 : cmp(a[col], b[col]) * (asc ? 1 : -1)));
    }
    if (this.rangeAB) out = out.slice(this.rangeAB[0], this.rangeAB[1] + 1);
    if (this.limitN != null) out = out.slice(0, this.limitN);
    out = embed(this.table, structuredClone(out), this.selectStr, (r) => this.visible("product_prices", r));
    if (this.one) {
      if (out.length === 0 && this.one === "single") return { data: null, error: { message: "no rows", code: "PGRST116" }, count };
      return { data: out[0] ?? null, error: null, count };
    }
    return { data: out, error: null, count };
  }
}

type Grant = { code: string; had: boolean; before: string | null; after: string | null; at: string };
const ms = (iso: string) => new Date(iso).getTime();

/** Mirrors `grant_order`: extends rights (never shortens) and records the change on the order. */
function grantOrder(a: { p_order: string; p_until: string | null }) {
  const d = db();
  const o = d.orders.find((x) => x.id === a.p_order);
  if (!o) throw new Error("order not found");
  const now = new Date().toISOString();
  const log: Grant[] = [];
  let latest: string | null = null;
  for (const code of o.codes as string[]) {
    const cur = d.indicator_rights.find((r) => r.user_id === o.user_id && r.code === code);
    const before = (cur?.expires_at as string | null | undefined) ?? null;
    let target: string | null;
    if (cur && before === null) target = null;
    else if (o.billing === "subscription") target = before && before > a.p_until! ? before : a.p_until;
    else if (o.duration_days == null) target = null;
    else target = new Date(Math.max(Date.now(), before ? ms(before) : 0) + Number(o.duration_days) * 864e5).toISOString();
    const note = `ซื้อ: ${o.product_name}`;
    if (cur) Object.assign(cur, { expires_at: target, note, updated_at: now });
    else d.indicator_rights.push({ user_id: o.user_id, code, expires_at: target, note, granted_by: null, updated_at: now });
    log.push({ code, had: Boolean(cur), before, after: target, at: now });
    if (target && (!latest || target > latest)) latest = target;
  }
  Object.assign(o, { grants: log, access_until: latest });
  return latest;
}

/** Mirrors `revoke_order`: refunded order loses exactly the access it added. */
function revokeOrder(a: { p_order: string }) {
  const d = db();
  const o = d.orders.find((x) => x.id === a.p_order);
  if (!o || o.status !== "paid") return false;
  o.status = "refunded";
  const drop = (code: string) => d.indicator_rights.splice(d.indicator_rights.findIndex((r) => r.user_id === o.user_id && r.code === code), 1);
  for (const g of (o.grants as Grant[] | null) ?? []) {
    const cur = d.indicator_rights.find((r) => r.user_id === o.user_id && r.code === g.code);
    if (!cur) continue;
    const exp = (cur.expires_at as string | null) ?? null;
    const note = `คืนเงิน: ${o.product_name}`;
    if (g.after === null) {
      if (g.had && g.before === null) continue;
      if (exp !== null) continue;
      const otherLifetime = d.orders.some((x) => x.user_id === o.user_id && x.id !== o.id && x.status === "paid"
        && ((x.grants as Grant[] | null) ?? []).some((xg) => xg.code === g.code && xg.after === null && !(xg.had && xg.before === null)));
      if (otherLifetime) continue;
      if (g.had) Object.assign(cur, { expires_at: g.before, note }); else drop(g.code);
    } else {
      if (exp === null) continue;
      const added = ms(g.after) - Math.max(g.before ? ms(g.before) : ms(g.at), ms(g.at));
      const next = ms(exp) - added;
      if (next <= Date.now() + 60e3) {
        if (g.had) Object.assign(cur, { expires_at: new Date(Math.min(next, Date.now())).toISOString(), note }); else drop(g.code);
      } else Object.assign(cur, { expires_at: new Date(Math.min(next, ms(exp))).toISOString(), note });
    }
  }
  return true;
}

/** Mirrors `ingest_signal_events`: idempotent on (code, event_id). Returns the number of new events. */
function ingest(events: Row[]) {
  const d = db();
  let inserted = 0;
  for (const e of events) {
    if (d.signal_events.some((x) => x.code === e.code && x.event_id === e.event_id)) continue;
    const obs = Number(e.observed_at);
    const { body: _body, ...row } = e;
    d.signal_events.push({ ...row, id: nextId(), observed_at: new Date(obs < 1e12 ? obs * 1000 : obs).toISOString() });
    inserted++;
  }
  return inserted;
}

/** Service-role equivalent: no RLS, plus the ingest RPC. */
export function createMemoryAdminClient() {
  return {
    from: (table: TableName) => new Query(table, () => true),
    rpc: async (name: string, args: Record<string, unknown>) => {
      if (name === "ingest_signal_events") return { data: ingest((args.p_events as Row[]) ?? []), error: null };
      if (name === "grant_order") return { data: grantOrder(args as Parameters<typeof grantOrder>[0]), error: null };
      if (name === "revoke_order") return { data: revokeOrder(args as Parameters<typeof revokeOrder>[0]), error: null };
      return { data: null, error: null };
    },
  };
}
