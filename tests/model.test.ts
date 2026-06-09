import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { parseModel } from "../src/engine/parser";
import { resolveModel } from "../src/engine/model";

function loadDir(dir: string) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".bum") || f.endsWith(".buc"))
    .map((f) => ({ name: f, xml: readFileSync(`${dir}/${f}`, "utf8") }));
}

describe("model", () => {
  const raw = parseModel(loadDir("tests/fixtures/rtmcs"));

  it("detects protocol from fixture content", () => {
    expect(resolveModel(raw).protocol).toBe("RTMCS");
  });

  it("orders machines M0..M6 by refines chain", () => {
    expect(resolveModel(raw).machines.map((x) => x.name))
      .toEqual(["M0","M1","M2","M3","M4","M5","M6"]);
  });

  it("indexes variable types from invariants", () => {
    const m = resolveModel(raw);
    expect(m.variableTypes.get("fwdNextND")).toBe("fwdNextND ∈ fwdRouteTbl → ND");
    expect(m.variableTypes.get("ctlNeighbours")).toBe("ctlNeighbours ∈ PKT ↔ (ND ∪ {FAILED_XMIT})");
  });

  it("collects sets and constants from seen contexts", () => {
    const m = resolveModel(raw);
    expect(m.sets).toContain("TYPE");
    expect(m.constants).toContain("CONTROL");
  });
});
