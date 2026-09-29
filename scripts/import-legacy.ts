// Import legacy tvaccess JSON (news + morning brief) into Supabase.
//   node --env-file=.env.local --experimental-strip-types scripts/import-legacy.ts <path-to-tvaccess>
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const dir = process.argv[2];
if (!dir) throw new Error("usage: import-legacy.ts <path-to-tvaccess>");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required");
const db = createClient(url, key, { auth: { persistSession: false } });

type WorldItem = { source: string; title: string; link: string; at?: string; date?: string; title_th?: string; gold?: string };

const worldPath = join(dir, "tv_world.json");
if (existsSync(worldPath)) {
  const { items } = JSON.parse(readFileSync(worldPath, "utf8")) as { items: WorldItem[] };
  const rows = items.map((n) => ({
    source: n.source,
    title: n.title,
    title_th: n.title_th ?? null,
    link: n.link,
    gold_impact: n.gold ?? null,
    // `at` is Bangkok local time in the legacy file.
    published_at: n.at ? new Date(`${n.at}:00+07:00`).toISOString() : new Date(`${n.date} GMT`).toISOString(),
  }));
  const { error } = await db.from("news_items").upsert(rows, { onConflict: "link" });
  if (error) throw error;
  console.log(`news_items: ${rows.length}`);
}

const briefPath = join(dir, "tv_morning_brief.json");
if (existsSync(briefPath)) {
  const b = JSON.parse(readFileSync(briefPath, "utf8")) as { date: string; facts: string; story: string };
  const { error } = await db.from("daily_briefs").upsert({ brief_date: b.date, facts: b.facts, story: b.story });
  if (error) throw error;
  console.log(`daily_briefs: ${b.date}`);
}
