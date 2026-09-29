import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "../env";
import { createMockClient } from "../mock/db";
import { isMockMode } from "../mock/mode";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function supabaseClient(cookieStore: CookieStore) {
  return createServerClient(publicEnv.supabaseUrl(), publicEnv.supabaseKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** Per-request client acting as the signed-in user (RLS applies). */
export async function createClient() {
  const cookieStore = await cookies();
  if (isMockMode()) {
    const writable = (fn: () => void) => { try { fn(); } catch { /* read-only in Server Components */ } };
    return createMockClient({
      get: (n) => cookieStore.get(n),
      set: (n, v, o) => writable(() => cookieStore.set(n, v, o)),
      delete: (n) => writable(() => cookieStore.delete(n)),
    }) as unknown as ReturnType<typeof supabaseClient>;
  }
  return supabaseClient(cookieStore);
}
