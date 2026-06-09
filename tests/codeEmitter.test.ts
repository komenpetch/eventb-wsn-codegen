import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { parseModel } from "../src/engine/parser";
import { resolveModel } from "../src/engine/model";
import { matchPatterns } from "../src/engine/patternMatcher";
import { resolveEncodings } from "../src/engine/encodingResolver";
import { translate } from "../src/engine/ruleEngine";
import { emit } from "../src/engine/codeEmitter";

function loadDir(dir: string) {
  return readdirSync(dir).filter((f) => /\.(bum|buc)$/.test(f))
    .map((f) => ({ name: f, xml: readFileSync(`${dir}/${f}`, "utf8") }));
}
const model = resolveModel(parseModel(loadDir("tests/fixtures/rtmcs")));
const encoded = resolveEncodings(model, matchPatterns(model));
const tree = emit(encoded, translate(encoded));
const file = (p: string) => tree.find((f) => f.path.endsWith(p))?.content ?? "";

describe("codeEmitter", () => {
  it("emits a NetworkProtocolBase subclass header", () => {
    expect(file("RTMCS.h")).toContain("class RTMCS : public NetworkProtocolBase");
    expect(file("RTMCS.h")).not.toContain("RoutingProtocolBase");
  });
  it("declares fields by encoding form", () => {
    const h = file("RTMCS.h");
    expect(h).toContain("std::map<std::pair<int,int>, int> fwdNextND;");
    expect(h).toContain("std::map<int, std::set<int>> ctlNeighbours;");
    expect(h).toContain("std::set<std::pair<int,int>> sentUp;");
  });
  it("emits .ned, omnetpp.ini, and eb_helpers.h", () => {
    expect(tree.some((f) => f.path.endsWith("RTMCS.ned"))).toBe(true);
    expect(tree.some((f) => f.path.endsWith("omnetpp.ini"))).toBe(true);
    expect(tree.some((f) => f.path.endsWith("eb_helpers.h"))).toBe(true);
  });
});
