import { afterEach, describe, expect, it, vi } from "vitest";
import { checkExnessAffiliation, parseAffiliation } from "@/lib/exness-ib";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("parseAffiliation", () => {
  it("reads the affiliation flag", () => {
    expect(parseAffiliation({ affiliation: true, accounts: ["123"] })).toBe(true);
    expect(parseAffiliation({ affiliation: false })).toBe(false);
    expect(parseAffiliation({ status: "ok" })).toBeNull();
    expect(parseAffiliation(null)).toBeNull();
  });
});

describe("checkExnessAffiliation", () => {
  it("is unavailable without partner credentials", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await checkExnessAffiliation("12345678")).toBe("unavailable");
    expect(f).not.toHaveBeenCalled();
  });
  it("logs in once and checks the account", async () => {
    vi.stubEnv("EXNESS_PARTNER_LOGIN", "partner@example.com");
    vi.stubEnv("EXNESS_PARTNER_PASSWORD", "test-only");
    const f = vi.fn(async (url: string, init: RequestInit) => {
      if (url.endsWith("/api/v2/auth/")) return new Response(JSON.stringify({ token: "t1" }));
      expect((init.headers as Record<string, string>).authorization).toBe("JWT t1");
      const { client_account } = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ affiliation: client_account === "12345678" }));
    });
    vi.stubGlobal("fetch", f);
    expect(await checkExnessAffiliation("12345678")).toBe("yes");
    expect(await checkExnessAffiliation("87654321")).toBe("no");
    expect(f.mock.calls.filter(([u]) => String(u).endsWith("/api/v2/auth/"))).toHaveLength(1); // token cached
  });
});
