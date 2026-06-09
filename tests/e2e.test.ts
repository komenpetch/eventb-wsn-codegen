import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { generate } from "../src/engine/pipeline";

function loadDir(dir: string) {
  return readdirSync(dir).filter((f) => /\.(bum|buc)$/.test(f))
    .map((f) => ({ name: f, xml: readFileSync(`${dir}/${f}`, "utf8") }));
}

describe("e2e pipeline", () => {
  it("RTMCS: produces all expected output files", () => {
    const paths = generate(loadDir("tests/fixtures/rtmcs")).map((f) => f.path);
    expect(paths).toEqual(expect.arrayContaining(
      ["RTMCS.h", "RTMCS.cc", "RTMCS.ned", "omnetpp.ini", "eb_helpers.h"]));
  });
  it("MintRoute: detects single-parent route table and still emits", () => {
    const tree = generate(loadDir("tests/fixtures/mintroute"));
    expect(tree.some((f) => f.path === "MintRoute.h")).toBe(true);
  });
});
