import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { parseModel } from "../src/engine/parser";
import { resolveModel } from "../src/engine/model";
import { matchPatterns } from "../src/engine/patternMatcher";

function loadDir(dir: string) {
  return readdirSync(dir).filter((f) => /\.(bum|buc)$/.test(f))
    .map((f) => ({ name: f, xml: readFileSync(`${dir}/${f}`, "utf8") }));
}
const model = resolveModel(parseModel(loadDir("tests/fixtures/rtmcs")));

describe("patternMatcher", () => {
  it("always binds CommPattern with the flood table", () => {
    const p = matchPatterns(model);
    expect(p.comm.floodTableVar).toBe("floodTbl");
  });
  it("detects a pair-keyed RouteTable for RTMCS", () => {
    const p = matchPatterns(model);
    expect(p.route?.kind).toBe("pair");
    expect(p.route?.tableVars).toEqual(expect.arrayContaining(["fwdRouteTbl", "bwdRouteTbl"]));
  });
  it("binds ENVPattern neighbour vars", () => {
    expect(matchPatterns(model).env.neighbourVars).toContain("ctlNeighbours");
  });
});
