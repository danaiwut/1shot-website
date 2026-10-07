import { describe, expect, it } from "vitest";
import { parseVolumes } from "@/lib/exness";

describe("parseVolumes", () => {
  it("accepts common field names and sums duplicates per account/day", () => {
    const rows = parseVolumes({
      data: [
        { client_account: "20481234", date: "2026-10-01T10:00:00Z", volume_lots: 1.25 },
        { account: "20481234", day: "2026-10-01", lots: "0.75" },
        { login: 30917755, trade_date: "2026-10-02", volume: 2 },
      ],
    });
    expect(rows).toEqual([
      { account: "20481234", day: "2026-10-01", lots: 2 },
      { account: "30917755", day: "2026-10-02", lots: 2 },
    ]);
  });
  it("drops rows without a valid account, date or volume", () => {
    expect(parseVolumes([{ account: "abc", day: "2026-10-01", lots: 1 }, { account: "12345", day: "bad", lots: 1 }, { account: "12345", day: "2026-10-01", lots: -1 }])).toEqual([]);
    expect(parseVolumes(null)).toEqual([]);
  });
});
