import { createHash } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
  process.env.GOOGLE_CLIENT_SECRET = "test-secret";
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
});

describe("startGoogleFlow", () => {
  it("builds a Google URL that returns to our own domain with state, hashed nonce and PKCE", async () => {
    const { startGoogleFlow } = await import("@/lib/google-oauth");
    const { url, flow } = startGoogleFlow("https://example.test", "/store");
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    const q = u.searchParams;
    expect(q.get("redirect_uri")).toBe("https://example.test/auth/google/callback");
    expect(q.get("client_id")).toBe("test-client.apps.googleusercontent.com");
    expect(q.get("state")).toBe(flow.state);
    expect(q.get("nonce")).toBe(createHash("sha256").update(flow.nonce).digest("hex"));
    expect(q.get("code_challenge")).toBe(createHash("sha256").update(flow.verifier).digest("base64url"));
    expect(q.get("code_challenge_method")).toBe("S256");
    expect(flow.next).toBe("/store");
    expect(flow.redirectUri).toBe("https://example.test/auth/google/callback");
    expect(url).not.toContain("test-secret");
  });

  it("uses fresh random values every time", async () => {
    const { startGoogleFlow } = await import("@/lib/google-oauth");
    const a = startGoogleFlow("https://example.test").flow, b = startGoogleFlow("https://example.test").flow;
    expect(a.state).not.toBe(b.state);
    expect(a.nonce).not.toBe(b.nonce);
  });
});
