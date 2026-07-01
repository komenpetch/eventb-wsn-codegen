import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { generate } from "../src/engine/pipeline";

const load = (n: string) =>
  ({ name: `${n}.bum`, xml: readFileSync(`tests/fixtures/shdecom/${n}.bum`, "utf8") });

describe("snapshot: shDecom6_2 → INET C++", () => {
  it("pM1", () => {
    expect(generate([load("pM1")], "pM1", "Pm1App")).toMatchSnapshot();
  });
  it("uM2", () => {
    expect(generate([load("pM1"), load("uM2")], "uM2", "Um2App")).toMatchSnapshot();
  });
  it("pM3", () => {
    expect(generate([load("pM1"), load("uM2"), load("pM3")], "pM3", "Pm3App")).toMatchSnapshot();
  });
});
