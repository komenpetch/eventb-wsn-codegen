import { describe, it, expect } from "vitest";
import { RULES } from "../src/engine/rules";
import type { EncodingForm } from "../src/engine/types";

// Layer 2 (spec §8): one worked example per translation rule (the Table 3-2
// snippets), asserting the rule both matches the Event-B surface form and emits
// the exact C++. Most rules ignore the encoding callback; A7/A8 branch on it, so
// those get extra container-specific cases.
const noEnc = (): EncodingForm | undefined => undefined;
const encOf =
  (forms: Record<string, EncodingForm>) =>
  (id: string): EncodingForm | undefined =>
    forms[id];

interface Case {
  id: string;
  expr: string;
  cpp: string;
  enc?: (id: string) => EncodingForm | undefined;
}

const CASES: Case[] = [
  // ── Tier 3 — SourceRouteCache (DSR) ──────────────────────────────────────
  { id: "R19", expr: "pNd = ran({nIdx}◁ran({pkt}◁dsrPath))", cpp: "int pNd = routeNodeAt(dsrPath, pkt, nIdx);" },
  { id: "R20", expr: "card(ran({pkt}◁dsrPath))", cpp: "routeLength(dsrPath, pkt)" },
  // ── Tier 2 — PairRouteTable ──────────────────────────────────────────────
  { id: "R17", expr: "s ∈ ran({x}◁dom(fwdNextND))", cpp: "domRestrictedRange(fwdNextND, x).count(s) > 0" },
  { id: "R18", expr: "nxt = fwdNextND(x↦s)", cpp: "int nxt = tupleApply(fwdNextND, x, s);" },
  // ── Tier 1 — cross-protocol common ───────────────────────────────────────
  { id: "R1", expr: "type(pkt) ∈ CONTROL", cpp: "CONTROL.count(getType(pkt)) > 0" },
  { id: "R2", expr: "x↦s ∈ dom(bwdNextND)", cpp: "bwdNextND.find({x, s}) != bwdNextND.end()" },
  { id: "R3", expr: "xmittedPkts ≔ xmittedPkts ∪ {pkt}", cpp: "xmittedPkts.insert(pkt);" },
  { id: "R4", expr: "middleware ≔ middleware ∖ {pkt}", cpp: "middleware.erase(pkt);" },
  { id: "R5", expr: "T ≔ D ◁ R", cpp: "T = eb_dom_restrict(D, R);" },
  { id: "R6", expr: "nbrs = ran({pkt} ◁ envNeighbours)", cpp: "const std::set<int>& nbrs = envNeighbours.at(pkt);" },
  { id: "R7", expr: "nbs = wsnLinks[{f}]", cpp: "const std::set<int>& nbs = wsnLinks.at(f);" },
  { id: "R8", expr: "R ≔ R ▷ {x}", cpp: "eb_range_anti_restrict_pairset(R, std::set<int>{x});" },
  { id: "R9", expr: "R ⊴ {k ↦ v}", cpp: "R[k] = v;" },
  { id: "R10", expr: "pkt ∈ ran(sentUp ∪ sentDown)", cpp: "eb_in_range_union(sentUp, sentDown, pkt)" },
  { id: "R11", expr: "{pkt} ◁ ctlNeighbours ≠ ∅", cpp: "(ctlNeighbours.count(pkt) > 0 && !ctlNeighbours.at(pkt).empty())" },
  { id: "R12", expr: "nb ∉ dom(sentUp ∪ sentDown)", cpp: "!eb_in_dom_union_pairset(sentUp, sentDown, nb)" },
  { id: "R13", expr: "nbHops ≔ nbHops ∪ {s ↦ {pkt ↦ nbh}}", cpp: "nbHops[s][pkt] = nbh;" },
  { id: "R14", expr: "finalDestAddr ≔ {pkt} ⩤ finalDestAddr", cpp: "finalDestAddr.erase(pkt);" },
  { id: "R15", expr: "pkt ∉ floodTbl(s)", cpp: "(floodTbl.count(s) == 0 || floodTbl.at(s).count(pkt) == 0)" },
  { id: "R16", expr: "destBuff(des) ≔ destBuff(des) ∪ {pkt}", cpp: "destBuff[des].insert(pkt);" },
  // ── Auxiliary A1–A5 ──────────────────────────────────────────────────────
  { id: "A1", expr: "card(middleware)", cpp: "middleware.size()" },
  { id: "A2", expr: "middleware = ∅", cpp: "middleware.empty()" },
  { id: "A2", expr: "middleware ≠ ∅", cpp: "!middleware.empty()" },
  { id: "A3", expr: "pkt ∈ ran(WiMedium)", cpp: "eb_in_range(WiMedium, pkt)" },
  { id: "A4", expr: "S ≔ S ∪ T", cpp: "S.insert(T.begin(), T.end());" },
  { id: "A5", expr: "pkt ∈ ran(sentUp ∪ sentDown)∖destBuff(des)", cpp: "eb_in_range_union(sentUp, sentDown, pkt) && destBuff.at(des).count(pkt) == 0" },
  // ── Extended executable forms A6–A10 ─────────────────────────────────────
  { id: "A6", expr: "pkt ∈ middleware", cpp: "middleware.count(pkt) > 0" },
  { id: "A6", expr: "pkt ∉ xmittedPkts", cpp: "xmittedPkts.count(pkt) == 0" },
  { id: "A7", expr: "s = initialSrcAddr(pkt)", cpp: "int s = initialSrcAddr.at(pkt);" },
  { id: "A7", expr: "grp = adj(nd)", cpp: "const std::set<int>& grp = adj.at(nd);", enc: encOf({ adj: "map-of-sets" }) },
  { id: "A8", expr: "pkt ∈ dom(finalDestAddr)", cpp: "finalDestAddr.count(pkt) > 0" },
  { id: "A8", expr: "pkt ∉ dom(finalDestAddr)", cpp: "finalDestAddr.count(pkt) == 0" },
  { id: "A8", expr: "nb ∈ dom(sentUp)", cpp: "eb_in_dom_pairset(sentUp, nb)", enc: encOf({ sentUp: "pair-set" }) },
  { id: "A9", expr: "xmittedPkts ≔ ∅", cpp: "xmittedPkts.clear();" },
  { id: "A10", expr: "destBuff ≔ ND × {∅}", cpp: "destBuff.clear();" },
];

describe("rule catalog — per-rule snippets (Layer 2)", () => {
  for (const c of CASES) {
    it(`${c.id}: ${c.expr}`, () => {
      const rule = RULES.find((r) => r.id === c.id);
      expect(rule, `rule ${c.id} is defined`).toBeDefined();
      const m = rule!.match(c.expr);
      expect(m, `${c.id} matches "${c.expr}"`).not.toBeNull();
      expect(rule!.emit(m!, c.enc ?? noEnc)).toBe(c.cpp);
    });
  }

  it("every rule in the catalog has at least one per-rule test", () => {
    const tested = new Set(CASES.map((c) => c.id));
    const untested = RULES.map((r) => r.id).filter((id) => !tested.has(id));
    expect(untested, `untested rules: ${untested.join(", ")}`).toEqual([]);
  });
});
