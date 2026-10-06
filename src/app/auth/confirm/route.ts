import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { RESET_COOKIE, RESET_MAX_AGE } from "@/lib/auth-reset";
import { createClient } from "@/lib/supabase/server";

/*
 * Target of every Supabase Auth email link (signup confirmation, password reset, email change).
 * Handles both link styles:
 *   PKCE (default templates):   ?code=…&next=…
 *   token hash (custom template): ?token_hash={{ .TokenHash }}&type=signup|recovery|email_change&next=…
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  let next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";
  const recovery = type === "recovery" || next === "/reset-password";
  if (recovery) next = "/reset-password";

  const supabase = await createClient();
  const { error } = tokenHash && type
    ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("missing token") };

  if (error) return NextResponse.redirect(new URL(recovery ? "/forgot-password?error=expired" : "/login?error=confirm", request.url));
  const res = NextResponse.redirect(new URL(next, request.url));
  if (recovery) res.cookies.set(RESET_COOKIE, "1", { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: RESET_MAX_AGE });
  return res;
}
