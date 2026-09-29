import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "../env";
import { createMockAdminClient } from "../mock/db";
import { isMockMode } from "../mock/mode";

function supabaseAdmin() {
  return createClient(publicEnv.supabaseUrl(), serverEnv.supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Service-role client. Bypasses RLS — use only in trusted server code (webhooks, bot). */
export function createAdminClient() {
  if (isMockMode()) return createMockAdminClient() as unknown as ReturnType<typeof supabaseAdmin>;
  return supabaseAdmin();
}
