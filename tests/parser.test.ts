import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseModel } from "../src/engine/parser";

const pm3 = readFileSync("tests/fixtures/shdecom/pM3.bum", "utf8");
const cm2 = readFileSync("tests/fixtures/shdecom/cM2.buc", "utf8");

describe("parser", () => {
  it("extracts machine name, refines target, and variables", () => {
    const { machines } = parseModel([{ name: "pM3.bum", xml: pm3 }]);
    const m = machines[0];
    expect(m.name).toBe("pM3");
    expect(m.refines).toBe("uM2");
    expect(m.variables).toContain("senseBuff");
  });

  it("reads invariant predicates verbatim (Unicode preserved)", () => {
    const { machines } = parseModel([{ name: "pM3.bum", xml: pm3 }]);
    const inv = machines[0].invariants.find((i) => i.label === "MSensingUnit_sensing_inv_2");
    expect(inv?.text).toBe("senseBuff ∈ ND ∖ Dests → ℙ(ℤ)");
  });

  it("reads guards with labels", () => {
    const { machines } = parseModel([{ name: "pM3.bum", xml: pm3 }]);
    const ev = machines[0].events.find((e) =>
      e.guards.some((g) => g.text.includes("ctlSensedFlg(x) = FALSE")));
    expect(ev).toBeDefined();
    expect(ev!.guards.some((g) => g.text === "x ∈ dom(ctlSensedFlg) ∧ ctlSensedFlg(x) = FALSE")).toBe(true);
  });

  it("yields no machines for a context file", () => {
    const { machines } = parseModel([{ name: "cM2.buc", xml: cm2 }]);
    expect(machines.length).toBe(0);
  });

  it("parses contexts: sets, constants, axioms, extends", () => {
    const { contexts } = parseModel([{ name: "cM2.buc", xml: cm2 }]);
    const c = contexts[0];
    expect(c.name).toBe("cM2");
    expect(c.extendsCtx).toBe("cM1");
    expect(c.sets).toContain("TYPE");
    expect(c.constants).toEqual(expect.arrayContaining(["DATA", "CONTROL", "CTL_VAL", "type"]));
    expect(c.axioms.find((a) => a.label === "axm2_4")?.text).toBe("type ∈ PKT → TYPE");
  });
});
