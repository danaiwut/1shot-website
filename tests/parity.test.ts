// Parity with the original Python parsers (tvaccess/wf_contract.py, tv_shapes.py).
// fixtures.json is a frozen snapshot of the Python output; do not regenerate from the TS code.
import { describe, expect, it } from "vitest";
import fixtures from "./parity/fixtures.json";
import { parseWf1 } from "../src/lib/domain/wf1";
import { splitShapes, tfSeconds } from "../src/lib/domain/shapes";

const normalize = (v: unknown) => JSON.parse(JSON.stringify(v, (_k, x) => (x === undefined ? null : x)));

describe("WF1 parser matches wf_contract.parse", () => {
  for (const [name, c] of Object.entries(fixtures.wf1) as [string, { text: string; ok?: unknown; error?: string }][]) {
    it(name, () => {
      if (c.error) {
        expect(() => parseWf1(c.text, fixtures.now)).toThrow(c.error);
      } else {
        expect(normalize(parseWf1(c.text, fixtures.now))).toEqual(c.ok);
      }
    });
  }
});

describe("shapes match tv_shapes", () => {
  fixtures.shapes.forEach((c, i) => {
    it(`split #${i}`, () => {
      const [clean, shapes] = splitShapes(c.text);
      expect(clean).toBe(c.clean);
      expect(normalize(shapes)).toEqual(c.shapes);
    });
  });
  it("tf_seconds", () => {
    for (const [tf, secs] of Object.entries(fixtures.tf)) {
      expect(tfSeconds(tf === "None" ? null : tf)).toBe(secs);
    }
  });
});
