import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { parseModel } from "../src/engine/parser";
import { resolveModel } from "../src/engine/model";
import { matchPatterns } from "../src/engine/patternMatcher";
import { resolveEncodings } from "../src/engine/encodingResolver";

function loadDir(dir: string) {
  return readdirSync(dir).filter((f) => /\.(bum|buc)$/.test(f))
    .map((f) => ({ name: f, xml: readFileSync(`${dir}/${f}`, "utf8") }));
}
const model = resolveModel(parseModel(loadDir("tests/fixtures/rtmcs")));
const enc = resolveEncodings(model, matchPatterns(model)).encodings;

describe("encodingResolver", () => {
  it("function form for partial functions", () => {
    expect(enc.get("floodFlg")).toBe("function");   // ND → BOOL
  });
  it("pair-keyed for product-domain functions", () => {
    expect(enc.get("fwdNextND")).toBe("pair-keyed"); // fwdRouteTbl → ND, fwdRouteTbl ⊆ ND×ND
  });
  it("map-of-sets for relations with key→set access", () => {
    expect(enc.get("ctlNeighbours")).toBe("map-of-sets"); // ran({pkt}◁ctlNeighbours) used
    expect(enc.get("floodTbl")).toBe("map-of-sets");      // ND → ℙ(PKT)
  });
  it("pair-set for relations used only via pair membership", () => {
    expect(enc.get("sentUp")).toBe("pair-set");
    expect(enc.get("fwdRouteTbl")).toBe("pair-set");
  });
});
