import { afterEach, describe, expect, it, vi } from "vitest";
import { checkTradingViewUser } from "@/lib/tradingview";

afterEach(() => vi.unstubAllGlobals());

describe("checkTradingViewUser", () => {
  it("returns the canonical username on a case-insensitive exact match", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([{ username: "Somchai_FX" }, { username: "somchai_fx2" }]))));
    expect(await checkTradingViewUser("somchai_fx")).toEqual({ ok: true, username: "Somchai_FX" });
  });
  it("reports not_found when only partial matches come back", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([{ username: "somchai_fx2" }]))));
    expect(await checkTradingViewUser("somchai_fx")).toEqual({ ok: false, reason: "not_found" });
  });
  it("rejects invalid names without calling TradingView", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await checkTradingViewUser("bad name!")).toEqual({ ok: false, reason: "not_found" });
    expect(f).not.toHaveBeenCalled();
  });
  it("reports unavailable when TradingView can't be reached", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect(await checkTradingViewUser("somchai_fx")).toEqual({ ok: false, reason: "unavailable" });
  });
});
