import { describe, expect, it } from "vitest";
import { nextExpiry, splitTargets } from "@/lib/rights";

describe("splitTargets", () => {
  it("separates TradingView names from emails, one per line or comma", () => {
    expect(splitTargets("somchai_fx\n@Trader.99, a@b.co\nSOMCHAI_FX")).toEqual({
      names: ["somchai_fx", "Trader.99"], emails: ["a@b.co"], invalid: [],
    });
  });
  it("reports what can't be a TradingView name or email", () => {
    expect(splitTargets("ok_name ชื่อไทย bad@").invalid).toEqual(["ชื่อไทย", "bad@"]);
  });
});

describe("nextExpiry", () => {
  const now = Date.parse("2026-10-07T00:00:00Z");
  const days = { mode: "days", days: 30 } as const;
  it("adds days from now for a new or expired right", () => {
    expect(nextExpiry(days, undefined, now)).toBe("2026-11-06T00:00:00.000Z");
    expect(nextExpiry(days, "2026-01-01T00:00:00Z", now)).toBe("2026-11-06T00:00:00.000Z");
  });
  it("adds days on top of time that is left", () => {
    expect(nextExpiry(days, "2026-10-17T00:00:00Z", now)).toBe("2026-11-16T00:00:00.000Z");
  });
  it("never shortens lifetime when adding days", () => {
    expect(nextExpiry(days, null, now)).toBeUndefined();
  });
  it("sets lifetime or a fixed date as asked", () => {
    expect(nextExpiry({ mode: "lifetime" }, "2026-10-17T00:00:00Z", now)).toBeNull();
    expect(nextExpiry({ mode: "until", until: "2026-12-31T16:59:59.000Z" }, null, now)).toBe("2026-12-31T16:59:59.000Z");
  });
});
