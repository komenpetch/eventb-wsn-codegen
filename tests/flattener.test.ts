import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseModel } from "../src/engine/parser";
import { flatten } from "../src/engine/flattener";
import type { RawModel } from "../src/engine/types";

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

  it("gives EVERY event of a split the ancestor's body (1-to-N refinement)", () => {
    // Rodin allows several events to refine the same abstract event; when they
    // are `extended` they inherit the ancestor's guards/actions implicitly
    // (the DSR reverse_path_init/reverse_path_loop shape).
    const g = (label: string, text: string) => ({ label, text });
    const model: RawModel = {
      contexts: [],
      machines: [
        { name: "A", sees: [], variables: ["s"],
          invariants: [g("inv1", "s ⊆ PKT")],
          events: [{ label: "step", extended: false, parameters: ["p"],
            guards: [g("g1", "p ∈ s")], actions: [g("a1", "s ≔ s ∖ {p}")] }] },
        { name: "B", refines: "A", sees: [], variables: ["s"], invariants: [],
          events: [
            { label: "step_init", refines: "step", extended: true, parameters: [],
              guards: [g("g2", "p ∉ dom(f)")], actions: [] },
            { label: "step_loop", refines: "step", extended: true, parameters: [],
              guards: [g("g3", "p ∈ dom(f)")], actions: [] },
          ] },
      ],
    };
    const flat = flatten(model, "B");
    const init = flat.events.find((e) => e.label === "step_init")!;
    const loop = flat.events.find((e) => e.label === "step_loop")!;
    for (const ev of [init, loop]) {
      expect(ev.guards).toContain("p ∈ s");            // inherited from A.step
      expect(ev.actions).toContain("s ≔ s ∖ {p}");     // inherited from A.step
      expect(ev.parameters).toContain("p");
    }
    expect(flat.events.map((e) => e.label)).not.toContain("step"); // ancestor re-keyed away
  });

  it("throws on a refinement cycle instead of hanging", () => {
    const model: RawModel = {
      contexts: [],
      machines: [
        { name: "A", refines: "B", sees: [], variables: [], invariants: [], events: [] },
        { name: "B", refines: "A", sees: [], variables: [], invariants: [], events: [] },
      ],
    };
    expect(() => flatten(model, "A")).toThrow(/cycle/i);
  });

  it("collects variables across the chain (pM3 adds sensing state)", () => {
    const raw = parseModel([load("pM1"), load("uM2"), load("pM3")]);
    const flat = flatten(raw, "pM3");
    expect(flat.variables).toEqual(expect.arrayContaining(
      ["pktFwdr", "ctlNeighbours", "ctlSensedFlg", "senseBuff"]));
    expect(flat.variableTypes.get("ctlSensedFlg")).toBe("ctlSensedFlg ∈ ND ∖ Dests → BOOL");
  });
});
