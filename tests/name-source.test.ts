import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parseModel } from "../src/engine/parser";

// The component name may come from either of two places, and this holds them to
// agreement.
//
// Rodin stores the name nowhere as an attribute of its own. The file name carries it,
// and the optional text-tools plugin may also write a text_representation whose head
// line states it -- `machine pM1 sees C0`. The parser prefers the attribute and falls
// back to the file name.
//
// That is only safe while the two agree. They did over every Event-B project on disk
// when the preference was introduced (41 files carrying the attribute, 41 parsed, 41
// matching the file name, 0 disagreements, and 21 files carrying no attribute at all).
// If a project ever disagrees, one of the two is wrong about what the sibling files
// address the component by, and this test is where that surfaces.

const REPR = /org\.eventb\.texttools\.text_representation="([^"]*)"/;

function headName(xml: string): string | null {
  const m = REPR.exec(xml);
  if (!m) return null;
  const txt = m[1].replace(/&#10;/g, "\n").replace(/&amp;/g, "&");
  const head = /^\s*(?:machine|context)\s+([A-Za-z_]\w*)/.exec(txt);
  return head ? head[1] : null;
}

describe("component name source", () => {
  it("prefers the text_representation head when present", () => {
    // A machine whose file name and attribute deliberately disagree: the attribute wins.
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<org.eventb.core.machineFile org.eventb.core.configuration="org.eventb.core.fwd"' +
      ' org.eventb.texttools.text_representation="machine pM1 sees C0&#10;end"/>';
    const { machines } = parseModel([{ name: "RENAMED_OUTSIDE_RODIN.bum", xml }]);
    expect(machines[0].name).toBe("pM1");
  });

  it("falls back to the file name when the attribute is absent", () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<org.eventb.core.machineFile org.eventb.core.configuration="org.eventb.core.fwd"/>';
    const { machines } = parseModel([{ name: "pM1.bum", xml }]);
    expect(machines[0].name).toBe("pM1");
  });

  it("falls back when the attribute is present but its head does not parse", () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<org.eventb.core.machineFile org.eventb.texttools.text_representation="variables x"/>';
    const { machines } = parseModel([{ name: "pM1.bum", xml }]);
    expect(machines[0].name).toBe("pM1");
  });

  // The corpus check. Fixtures only -- the research models are not in this repo -- but it
  // runs over whatever .bum/.buc the fixtures hold, so adding a project extends it.
  it("the two sources agree on every fixture that carries both", () => {
    const roots = ["tests/fixtures"];
    const disagreements: string[] = [];
    let both = 0;
    const walk = (dir: string) => {
      if (!existsSync(dir)) return;
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (!/\.(bum|buc)$/.test(e.name)) continue;
        const xml = readFileSync(p, "utf8");
        const fromAttr = headName(xml);
        if (fromAttr === null) continue;
        both++;
        const fromFile = e.name.replace(/\.(bum|buc)$/, "");
        if (fromAttr !== fromFile)
          disagreements.push(`${p}: attribute "${fromAttr}" vs file "${fromFile}"`);
      }
    };
    walk(roots[0]);
    expect(both).toBeGreaterThan(0);
    expect(disagreements).toEqual([]);
  });
});
