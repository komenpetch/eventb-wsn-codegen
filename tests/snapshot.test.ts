import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { generate } from "../src/engine/pipeline";
import type { VirtualFileTree } from "../src/engine/types";

function loadDir(dir: string) {
  return readdirSync(dir)
    .filter((f) => /\.(bum|buc)$/.test(f))
    .map((f) => ({ name: f, xml: readFileSync(`${dir}/${f}`, "utf8") }));
}

const trees: Record<string, VirtualFileTree> = {
  rtmcs: generate(loadDir("tests/fixtures/rtmcs")),
  mintroute: generate(loadDir("tests/fixtures/mintroute")),
};
const pick = (tree: VirtualFileTree, suffix: string) =>
  tree.find((f) => f.path.endsWith(suffix))?.content ?? "";

// Layer 3 (spec §8): freeze the full generated output. These catch regressions,
// not correctness — the snapshot was eyeballed and approved before freezing.
// Update intentionally with `vitest -u` when the emitter legitimately changes.
describe("CodeEmitter — full-file snapshots", () => {
  const perProto: Record<string, string[]> = {
    rtmcs: ["RTMCS.h", "RTMCS.cc", "RTMCS.ned", "omnetpp.ini"],
    mintroute: ["MintRoute.h", "MintRoute.cc", "MintRoute.ned", "omnetpp.ini"],
  };
  for (const proto of Object.keys(perProto)) {
    for (const file of perProto[proto]) {
      it(`${proto}/${file}`, () => {
        expect(pick(trees[proto], file)).toMatchSnapshot();
      });
    }
  }
  it("eb_helpers.h (shared)", () => {
    expect(pick(trees.rtmcs, "eb_helpers.h")).toMatchSnapshot();
  });
});

// Layer 1b (spec §8): MintRoute exercises every encoding form. Assert the
// emitted header declares the field-to-container choices, since MintRoute is the
// case study whose route table is single-parent (map-of-sets) rather than the
// pair-keyed RTMCS table.
describe("MintRoute — field encodings", () => {
  const h = pick(trees.mintroute, "MintRoute.h");

  it("pair-keyed tables (link estimation, parent/cost) → map<pair,int>", () => {
    expect(h).toContain("std::map<std::pair<int,int>, int> received;");
    expect(h).toContain("std::map<std::pair<int,int>, int> receiveEst;");
    expect(h).toContain("std::map<std::pair<int,int>, int> parent;");
    expect(h).toContain("std::map<std::pair<int,int>, int> cost;");
  });
  it("single-parent route table → map<int,set<int>> (map-of-sets)", () => {
    expect(h).toContain("std::map<int, std::set<int>> neighbourTbl;");
  });
  it("pair-set channels/relations → set<pair<int,int>>", () => {
    expect(h).toContain("std::set<std::pair<int,int>> sentUp;");
    expect(h).toContain("std::set<std::pair<int,int>> sentDown;");
    expect(h).toContain("std::set<std::pair<int,int>> WiMedium;");
  });
  it("scalar function-form fields → map<int,int>", () => {
    expect(h).toContain("std::map<int, int> dataSeqNo;");
    expect(h).toContain("std::map<int, int> floodFlg;");
  });
});
