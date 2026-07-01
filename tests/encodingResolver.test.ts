import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseModel } from "../src/engine/parser";
import { flatten } from "../src/engine/flattener";
import { resolveEncodings } from "../src/engine/encodingResolver";

const load = (n: string) =>
  ({ name: `${n}.bum`, xml: readFileSync(`tests/fixtures/shdecom/${n}.bum`, "utf8") });
const enc = (target: string, files: string[]) =>
  resolveEncodings(flatten(parseModel(files.map(load)), target)).encodings;

describe("encodingResolver ENC1-6", () => {
  it("ENC2 plain set for createdPkts (⊆ PKT)", () => {
    expect(enc("pM1", ["pM1"]).get("createdPkts")).toBe("set");
  });
  it("ENC3 function for pktFwdr / pktData (⇸)", () => {
    const e = enc("pM1", ["pM1"]);
    expect(e.get("pktFwdr")).toBe("function");
    expect(e.get("pktData")).toBe("function");
  });
  it("ENC4 pair-set for buffers used by whole pairs", () => {
    const e = enc("pM1", ["pM1"]);
    for (const v of ["ndBuff", "sentUp", "sentDown", "recvBuff", "clrRecvBuffFlg", "destBuff"])
      expect(e.get(v)).toBe("pair-set");
  });
  it("ENC5 map-of-sets for ctlNeighbours (per-key access)", () => {
    expect(enc("pM1", ["pM1"]).get("ctlNeighbours")).toBe("map-of-sets");
  });
  it("ENC5 map-of-sets for senseBuff (→ ℙ(ℤ)) and ENC3 function for ctlSensedFlg (→ BOOL)", () => {
    const e = enc("pM3", ["pM1", "uM2", "pM3"]);
    expect(e.get("senseBuff")).toBe("map-of-sets");
    expect(e.get("ctlSensedFlg")).toBe("function");
  });
});
