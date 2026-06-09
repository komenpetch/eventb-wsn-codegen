import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseModel } from "../src/engine/parser";

const m5 = readFileSync("tests/fixtures/rtmcs/M5.bum", "utf8");
const c1 = readFileSync("tests/fixtures/rtmcs/C1.buc", "utf8");

describe("parser", () => {
  it("extracts machine name, refines target, and variables", () => {
    const { machines } = parseModel([{ name: "M5.bum", xml: m5 }]);
    const m = machines[0];
    expect(m.name).toBe("M5");
    expect(m.refines).toBe("M4");
    expect(m.variables).toContain("fwdNextND");
  });

  it("reads invariant predicates verbatim (Unicode preserved)", () => {
    const { machines } = parseModel([{ name: "M5.bum", xml: m5 }]);
    const inv = machines[0].invariants.find((i) => i.label === "inv4_6");
    expect(inv?.text).toBe("fwdNextND ∈ fwdRouteTbl → ND");
  });

  it("reads guards with labels", () => {
    const { machines } = parseModel([{ name: "M5.bum", xml: m5 }]);
    const ev = machines[0].events.find((e) =>
      e.guards.some((g) => g.text.includes("fwdNextND(x↦s)")));
    expect(ev).toBeDefined();
    expect(ev!.guards.some((g) => g.text === "nxt = fwdNextND(x↦s)")).toBe(true);
  });

  it("yields no machines for a context file", () => {
    const { machines } = parseModel([{ name: "C1.buc", xml: c1 }]);
    expect(machines.length).toBe(0);
  });

  it("parses contexts: sets, constants, axioms, extends", () => {
    const { contexts } = parseModel([{ name: "C1.buc", xml: c1 }]);
    const c = contexts[0];
    expect(c.name).toBe("C1");
    expect(c.extendsCtx).toBe("C0");
    expect(c.sets).toContain("TYPE");
    expect(c.constants).toEqual(expect.arrayContaining(["DATA", "CONTROL", "type", "FAILED_XMIT"]));
    expect(c.axioms.find((a) => a.label === "axm1_4")?.text).toBe("type ∈ PKT → TYPE");
  });
});
