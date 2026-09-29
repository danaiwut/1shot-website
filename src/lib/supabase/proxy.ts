import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, publicEnv } from "../env";
import { isMockMode, MOCK_SESSION_COOKIE } from "../mock/mode";

const MEMBER_PATHS = ["/dashboard", "/signals", "/news", "/account", "/admin"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (isMockMode()) return guard(request, response, Boolean(request.cookies.get(MOCK_SESSION_COOKIE)?.value));
  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(publicEnv.supabaseUrl(), publicEnv.supabaseKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // Refreshes the session cookie; must run before any redirect decision.
  const { data } = await supabase.auth.getClaims();
  return guard(request, response, Boolean(data?.claims?.sub));
}

function guard(request: NextRequest, response: NextResponse, signedIn: boolean) {
  const path = request.nextUrl.pathname;

  if (!signedIn && MEMBER_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  if (signedIn && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}
