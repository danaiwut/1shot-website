/**
 * Mockup mode: the whole site runs on an in-memory sample database instead of Supabase.
 * On when NEXT_PUBLIC_MOCK_MODE=1, or automatically while Supabase is not configured
 * (set NEXT_PUBLIC_MOCK_MODE=0 to force it off). Safe to call on server and client.
 */
export function isMockMode() {
  const flag = process.env.NEXT_PUBLIC_MOCK_MODE;
  if (flag === "1") return true;
  if (flag === "0") return false;
  return !(process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
}

export const MOCK_SESSION_COOKIE = "mock-session";
