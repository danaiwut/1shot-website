import { describe, expect, it } from "vitest";
import { describeAudit, requestSubject } from "@/lib/support";

describe("describeAudit", () => {
  it("describes a new lifetime right", () => {
    expect(describeAudit({ action: "right.grant", detail: { op: "insert", code: "GK", expires_at: null } })).toEqual({ title: "เพิ่มสิทธิ์ GK", detail: "ตลอดชีพ" });
  });
  it("shows the previous expiry on a renewal", () => {
    const d = describeAudit({ action: "right.grant", detail: { op: "update", code: "GK", expires_at: "2026-12-31T16:59:59Z", previous: "2026-10-31T16:59:59Z" } });
    expect(d.title).toBe("ต่ออายุหรือแก้ไขสิทธิ์ GK");
    expect(d.detail).toContain("เดิม ถึง");
  });
  it("includes the reason on a role change", () => {
    const d = describeAudit({ action: "role.change", detail: { from: "member", to: "admin", reason: "ทีมซัพพอร์ต" } });
    expect(d.title).toBe("เปลี่ยนบทบาทเป็นแอดมิน");
    expect(d.detail).toBe("จากสมาชิก · เหตุผล: ทีมซัพพอร์ต");
  });
  it("falls back to the raw action", () => {
    expect(describeAudit({ action: "something.new", detail: {} }).title).toBe("something.new");
  });
});

describe("requestSubject", () => {
  it("joins kind and indicator", () => {
    expect(requestSubject("rights", "GK")).toBe("สิทธิ์ 1Shot Indicators · GK");
    expect(requestSubject("help", null)).toBe("ความช่วยเหลือ");
  });
});
