import "server-only";
import { Wf1Error } from "../domain/wf1";
import { createAdminClient } from "../supabase/admin";
import { alertToRows } from "./rows";

export type IngestResult =
  | { ok: true; inserted: number; events: number }
  | { ok: false; status: 400 | 409 | 500; error: string };

export async function ingestAlert(text: string): Promise<IngestResult> {
  const admin = createAdminClient();
  let result: IngestResult;
  try {
    const rows = alertToRows(text);
    const { data, error } = await admin.rpc("ingest_signal_events", { p_events: rows });
    if (error) {
      result = { ok: false, status: error.code === "P0409" ? 409 : 500, error: error.message };
    } else {
      result = { ok: true, inserted: Number(data ?? 0), events: rows.length };
    }
  } catch (err) {
    result = err instanceof Wf1Error
      ? { ok: false, status: 400, error: err.message }
      : { ok: false, status: 500, error: "ingest failed" };
  }

  await admin.from("webhook_receipts").insert({
    ok: result.ok,
    inserted: result.ok ? result.inserted : 0,
    error: result.ok ? null : result.error,
    excerpt: text.slice(0, 500),
  });
  return result;
}
