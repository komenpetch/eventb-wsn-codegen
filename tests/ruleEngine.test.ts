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

// P2 — executable forms beyond the frozen R1–R20, plus engine-level conjunction
// splitting and typing-predicate skipping. All asserted against the real RTMCS
// .bum guards/actions (exact expression text taken from scripts/analyze.ts).
describe("ruleEngine — extended executable forms", () => {
  const cpps = frags.map((f) => f.cpp);

  it("A9: inits an empty container (X ≔ ∅) with clear()", () => {
    expect(cpps).toContain("xmittedPkts.clear();");
  });
  it("A10: inits a map-of-sets product (X ≔ A × {∅}) with clear()", () => {
    expect(cpps).toContain("destBuff.clear();");
  });
  it("A7: translates plain function application y = f(x)", () => {
    expect(cpps).toContain("int s = initialSrcAddr.at(pkt);");
  });
  it("A6: translates bare set membership x ∈ S", () => {
    expect(cpps).toContain("middleware.count(pkt) > 0");
  });
  it("A8: translates single-table domain membership x ∈ dom(R)", () => {
    expect(cpps).toContain("finalDestAddr.count(pkt) > 0");
  });
  it("skips pure typing predicates (pkt ∈ PKT, fDes ∈ ND) — no code", () => {
    expect(frags.some((f) => f.sourceExpr === "pkt ∈ PKT")).toBe(false);
    expect(frags.some((f) => f.sourceExpr === "fDes ∈ ND")).toBe(false);
    expect(cpps.some((c) => /^(PKT|ND)\./.test(c))).toBe(false);
  });
  it("splits conjunctions so every clause translates, not just the first", () => {
    // pkt ∈ dom(finalDestAddr) ∧ des = finalDestAddr(pkt)
    expect(cpps).toContain("finalDestAddr.count(pkt) > 0");
    expect(cpps).toContain("int des = finalDestAddr.at(pkt);");
  });
});
