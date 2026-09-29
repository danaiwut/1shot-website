import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "../env";

/** Service-role client. Bypasses RLS — use only in trusted server code (webhooks, bot). */
export function createAdminClient() {
  return createClient(publicEnv.supabaseUrl(), serverEnv.supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
