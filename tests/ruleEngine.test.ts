import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { parseModel } from "../src/engine/parser";
import { resolveModel } from "../src/engine/model";
import { matchPatterns } from "../src/engine/patternMatcher";
import { resolveEncodings } from "../src/engine/encodingResolver";
import { translate } from "../src/engine/ruleEngine";

function loadDir(dir: string) {
  return readdirSync(dir).filter((f) => /\.(bum|buc)$/.test(f))
    .map((f) => ({ name: f, xml: readFileSync(`${dir}/${f}`, "utf8") }));
}
const model = resolveModel(parseModel(loadDir("tests/fixtures/rtmcs")));
const encoded = resolveEncodings(model, matchPatterns(model));
const frags = translate(encoded);

describe("ruleEngine", () => {
  it("translates Form B function application (R18)", () => {
    const f = frags.find((x) => x.sourceExpr === "nxt = fwdNextND(x↦s)");
    expect(f?.rule).toBe("R18");
    expect(f?.cpp).toBe("int nxt = tupleApply(fwdNextND, x, s);");
    expect(f?.tier).toBe(2);
  });
  it("translates Form A membership (R17)", () => {
    const f = frags.find((x) => x.rule === "R17");
    expect(f?.cpp).toContain("domRestrictedRange(fwdNextND, x)");
  });
  it("tags provenance raw-XML for Tier 2 rules", () => {
    expect(frags.filter((f) => f.tier === 2).every((f) => f.provenance === "raw-XML")).toBe(true);
  });
});
