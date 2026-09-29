import { describe, expect, it } from "vitest";
import { createMockAdminClient, createMockClient } from "../src/lib/mock/db";
import { DEMO_MEMBER_ID, DEMO_OWNER_ID } from "../src/lib/mock/seed";

const as = (uid: string | null) => createMockClient({ get: (n) => (n === "mock-session" && uid ? { value: uid } : undefined) });

describe("mockup database", () => {
  it("derives setups from signal events like the SQL view", async () => {
    const { data, count } = await as(DEMO_OWNER_ID).from("setups").select("*", { count: "exact" }).order("updated_at", { ascending: false }).range(0, 4);
    expect(count).toBeGreaterThan(10);
    expect(data).toHaveLength(5);
    const rows = data as { updated_at: string; events: number }[];
    expect(rows[0].updated_at >= rows[4].updated_at).toBe(true);
    expect(rows.every((r) => r.events >= 1)).toBe(true);
  });

  it("limits members to indicators they hold an active right for", async () => {
    const { data } = await as(DEMO_MEMBER_ID).from("setups").select("*");
    const codes = new Set((data as { code: string }[]).map((r) => r.code));
    expect([...codes].every((c) => ["OB", "SD", "SW"].includes(c))).toBe(true); // AMD right has expired
    const { data: others } = await as(DEMO_MEMBER_ID).from("profiles").select("*");
    expect(others).toHaveLength(1);
  });

  it("embeds relations and supports or/ilike search", async () => {
    const { data } = await as(DEMO_OWNER_ID).from("profiles").select("*, telegram_links(tg_username), indicator_rights!fk(code)").or("email.ilike.%member%,display_name.ilike.%member%");
    const [p] = data as { telegram_links: { tg_username: string } | null; indicator_rights: unknown[] }[];
    expect(p.telegram_links?.tg_username).toBe("somchai_fx");
    expect(p.indicator_rights.length).toBeGreaterThan(0);
  });

  it("ingests events idempotently", async () => {
    const admin = createMockAdminClient();
    const e = { code: "OB", event_id: "test:1", setup_key: "test-setup", kind: "pending", observed_at: Math.floor(Date.now() / 1000), body: {} };
    expect((await admin.rpc("ingest_signal_events", { p_events: [e] })).data).toBe(1);
    expect((await admin.rpc("ingest_signal_events", { p_events: [e] })).data).toBe(0);
  });

  it("signs in any email, unknown ones as the demo owner", async () => {
    const jar = new Map<string, string>();
    const c = createMockClient({ get: (n) => (jar.has(n) ? { value: jar.get(n)! } : undefined), set: (n, v) => void jar.set(n, v), delete: (n) => void jar.delete(n) });
    await c.auth.signInWithPassword({ email: "nobody@example.com" });
    expect((await c.auth.getClaims()).data?.claims.sub).toBe(DEMO_OWNER_ID);
    await c.auth.signOut();
    expect((await c.auth.getClaims()).data).toBeNull();
  });
});
