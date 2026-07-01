import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { generate, generateAll, machineNames, defaultName } from "../src/engine/pipeline";

const load = (n: string) =>
  ({ name: `${n}.bum`, xml: readFileSync(`tests/fixtures/shdecom/${n}.bum`, "utf8") });
const all = () => [load("pM1"), load("uM2"), load("pM3")];

describe("pipeline.generate (single target)", () => {
  it("generates 3 files for a named target machine", () => {
    const tree = generate(all(), "pM3", "Pm3App");
    expect(tree.map((f) => f.path).sort()).toEqual(["Pm3App.cc", "Pm3App.h", "Pm3App.ned"]);
    expect(tree.find((f) => f.path === "Pm3App.cc")!.content).toContain("bool Pm3App::sensing(");
  });
  it("throws a clear error for an empty selection", () => {
    expect(() => generate([], "pM1", "X")).toThrow(/No Event-B/);
  });
});

describe("pipeline.machineNames / defaultName", () => {
  it("lists every machine in the project (name-agnostic)", () => {
    expect(machineNames(all())).toEqual(["pM1", "uM2", "pM3"]);
  });
  it("derives a default C++ name per machine label", () => {
    expect(defaultName("pM3")).toBe("Pm3App");
    expect(defaultName("uM4")).toBe("Um4App");
  });
});

describe("pipeline.generateAll (every machine)", () => {
  it("emits three files for EACH machine, each flattened over its own chain", () => {
    const tree = generateAll(all());
    expect(tree.map((f) => f.path).sort()).toEqual([
      "Pm1App.cc", "Pm1App.h", "Pm1App.ned",
      "Pm3App.cc", "Pm3App.h", "Pm3App.ned",
      "Um2App.cc", "Um2App.h", "Um2App.ned",
    ]);
    // The leaf (pM3) is the complete model — it carries the sensing state pM1 lacks.
    expect(tree.find((f) => f.path === "Pm3App.cc")!.content).toContain("bool Pm3App::sensing(");
    expect(tree.find((f) => f.path === "Pm1App.cc")!.content).not.toContain("sensing(");
  });
  it("honors a custom naming function", () => {
    const tree = generateAll([load("pM1")], (m) => `WSN_${m}`);
    expect(tree.map((f) => f.path).sort()).toEqual(["WSN_pM1.cc", "WSN_pM1.h", "WSN_pM1.ned"]);
  });
  it("throws a clear error for an empty selection", () => {
    expect(() => generateAll([])).toThrow(/No Event-B/);
  });
});
