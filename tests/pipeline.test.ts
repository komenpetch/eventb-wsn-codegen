import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { generate } from "../src/engine/pipeline";

// A first-time user can easily point the picker at the wrong folder. The
// pipeline must refuse such input with an actionable message instead of
// silently emitting a phantom (default-DSR) module from nothing.
describe("generate() input validation", () => {
  it("rejects an empty selection with an actionable message", () => {
    expect(() => generate([])).toThrow(/no event-b files/i);
  });

  it("rejects a selection that has context files but no machine", () => {
    const contextsOnly = readdirSync("tests/fixtures/rtmcs")
      .filter((f) => /\.buc$/.test(f))
      .map((f) => ({ name: f, xml: readFileSync(`tests/fixtures/rtmcs/${f}`, "utf8") }));
    expect(() => generate(contextsOnly)).toThrow(/machine/i);
  });
});
