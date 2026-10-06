import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { publicEnv, serverEnv } from "./env";

/*
 * Google sign-in without the Supabase-hosted redirect: Google returns to our own domain
 * (so the account chooser says "ไปยัง <our domain>"), we exchange the code for an ID token,
 * then hand that token to Supabase Auth (signInWithIdToken) so users and sessions still live in Supabase.
 *
 * state  — CSRF protection, checked against an httpOnly cookie
 * nonce  — Google embeds sha256(nonce) in the ID token; Supabase checks it against the raw value
 * PKCE   — code_verifier kept in the same cookie
 */

export const GOOGLE_COOKIE = "g_oauth";
export const GOOGLE_COOKIE_MAX_AGE = 600;
export const googleRedirectUri = () => `${publicEnv.siteUrl()}/auth/google/callback`;
export const googleConfigured = () => Boolean(serverEnv.googleClientId() && serverEnv.googleClientSecret());

export type GoogleFlow = { state: string; nonce: string; verifier: string; next?: string };

const b64url = (buf: Buffer) => buf.toString("base64url");
const sha256 = (v: string) => createHash("sha256").update(v).digest();

export function startGoogleFlow(next?: string): { url: string; flow: GoogleFlow } {
  const flow: GoogleFlow = { state: b64url(randomBytes(24)), nonce: b64url(randomBytes(24)), verifier: b64url(randomBytes(48)), next };
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: serverEnv.googleClientId(),
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: flow.state,
    nonce: sha256(flow.nonce).toString("hex"),
    code_challenge: b64url(sha256(flow.verifier)),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return { url: url.toString(), flow };
}

/** Exchange the authorization code for Google's ID token (JWT). */
export async function exchangeGoogleCode(code: string, verifier: string): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: serverEnv.googleClientId(),
      client_secret: serverEnv.googleClientSecret(),
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { id_token?: string };
  return body.id_token ?? null;
}
