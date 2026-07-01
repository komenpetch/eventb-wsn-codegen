import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseModel } from "../src/engine/parser";
import { flatten } from "../src/engine/flattener";

const load = (n: string) =>
  ({ name: `${n}.bum`, xml: readFileSync(`tests/fixtures/shdecom/${n}.bum`, "utf8") });

describe("flattener", () => {
  it("returns the target machine's own events when it is the base (pM1)", () => {
    const raw = parseModel([load("pM1")]);
    const flat = flatten(raw, "pM1");
    expect(flat.name).toBe("pM1");
    expect(flat.events.map((e) => e.label)).toContain("creatingPkt");
    const ev = flat.events.find((e) => e.label === "send_up")!;
    expect(ev.parameters).toEqual(["x", "pkt", "nbrs"]);
    expect(ev.actions.some((a) => a.includes("ctlNeighbours ≔ ctlNeighbours ∪"))).toBe(true);
  });

  it("merges an `extends` event with its ancestor body (uM2.start_tx)", () => {
    const raw = parseModel([load("pM1"), load("uM2")]);
    const flat = flatten(raw, "uM2");
    const ev = flat.events.find((e) => e.label === "start_tx")!;
    expect(ev.guards.some((g) => g.includes("x ↦ pkt ∉ sentDown"))).toBe(true);
    expect(ev.actions.some((a) => a.includes("sentDown ≔ sentDown"))).toBe(true);
  });

  it("unions ancestor + child clauses on a refined event (pM3.creatingDataPacket)", () => {
    const raw = parseModel([load("pM1"), load("uM2"), load("pM3")]);
    const flat = flatten(raw, "pM3");
    const ev = flat.events.find((e) => e.label === "creatingDataPacket")!;
    expect(ev.guards.some((g) => g.includes("type(pkt) = DATA"))).toBe(true);
    expect(ev.guards.some((g) => g.includes("data ∈ senseBuff(x)"))).toBe(true);
    expect(ev.actions.some((a) => a.includes("senseBuff(x) ≔  senseBuff(x) ∖{data}"))).toBe(true);
  });

  it("collects variables across the chain (pM3 adds sensing state)", () => {
    const raw = parseModel([load("pM1"), load("uM2"), load("pM3")]);
    const flat = flatten(raw, "pM3");
    expect(flat.variables).toEqual(expect.arrayContaining(
      ["pktFwdr", "ctlNeighbours", "ctlSensedFlg", "senseBuff"]));
    expect(flat.variableTypes.get("ctlSensedFlg")).toBe("ctlSensedFlg ∈ ND ∖ Dests → BOOL");
  });
});
