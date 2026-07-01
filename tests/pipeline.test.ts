import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { generate } from "../src/engine/pipeline";

const load = (n: string) =>
  ({ name: `${n}.bum`, xml: readFileSync(`tests/fixtures/shdecom/${n}.bum`, "utf8") });

describe("pipeline.generate", () => {
  it("generates 3 files for a named target machine", () => {
    const tree = generate([load("pM1"), load("uM2"), load("pM3")], "pM3", "Pm3App");
    expect(tree.map((f) => f.path).sort()).toEqual(["Pm3App.cc", "Pm3App.h", "Pm3App.ned"]);
    expect(tree.find((f) => f.path === "Pm3App.cc")!.content).toContain("bool Pm3App::sensing(");
  });
  it("throws a clear error for an empty selection", () => {
    expect(() => generate([], "pM1", "X")).toThrow(/No Event-B/);
  });
});
