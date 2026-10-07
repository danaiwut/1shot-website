import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { exchangeGoogleCode, GOOGLE_COOKIE, type GoogleFlow } from "@/lib/google-oauth";
import { createClient } from "@/lib/supabase/server";
import { isStaff, type Role } from "@/lib/types";

/*
 * Google returns here: ?code=…&state=…  (or ?error=… when the user cancels).
 * We verify state, swap the code for Google's ID token, and sign in to Supabase Auth with it,
 * so the user, session and RLS identity are the same as for email accounts.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const jar = await cookies();
  const raw = jar.get(GOOGLE_COOKIE)?.value;
  jar.delete({ name: GOOGLE_COOKIE, path: "/auth/google" });
  const fail = () => NextResponse.redirect(new URL("/login?error=oauth", request.url));

  let flow: GoogleFlow | null = null;
  try { flow = raw ? (JSON.parse(raw) as GoogleFlow) : null; } catch { flow = null; }
  const code = searchParams.get("code");
  if (!flow || !code || searchParams.get("error") || searchParams.get("state") !== flow.state) return fail();

  const idToken = await exchangeGoogleCode(code, flow.verifier, flow.redirectUri);
  if (!idToken) return fail();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken, nonce: flow.nonce });
  if (error || !data.user) return fail();

  // Google gives a name, not our display_name: fill it in once for new accounts.
  const { data: profile } = await supabase.from("profiles").select("role, display_name").eq("id", data.user.id).maybeSingle<{ role: string; display_name: string | null }>();
  const googleName = data.user.user_metadata?.full_name ?? data.user.user_metadata?.name;
  if (profile && !profile.display_name && typeof googleName === "string" && googleName.trim()) {
    await supabase.from("profiles").update({ display_name: googleName.trim().slice(0, 60) }).eq("id", data.user.id);
  }

  const next = flow.next && flow.next.startsWith("/") && !flow.next.startsWith("//")
    ? flow.next
    : profile && isStaff(profile.role as Role) ? "/admin" : "/dashboard";
  return NextResponse.redirect(new URL(next, request.url));
}
