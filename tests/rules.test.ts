import { describe, it, expect } from "vitest";
import { RULES } from "../src/engine/rules";
import type { EncodingForm } from "../src/engine/types";

const E = (m: Record<string, EncodingForm>) => (id: string) => m[id];
function emit(expr: string, enc: (id: string) => EncodingForm | undefined): string {
  for (const r of RULES) { const h = r.match(expr); if (h) return r.emit(h, enc); }
  throw new Error(`no rule for: ${expr}`);
}

describe("38-rule catalog", () => {
  const buffers = E({ ndBuff: "pair-set", sentUp: "pair-set", sentDown: "pair-set",
    ctlNeighbours: "map-of-sets", createdPkts: "set", pktFwdr: "function",
    pktData: "function", senseBuff: "map-of-sets", ctlSensedFlg: "function" });

  it("PS1 pair membership", () => {
    expect(emit("x ↦ pkt ∉ sentDown", buffers)).toBe("sentDown.count({x, pkt}) == 0");
    expect(emit("x ↦ pkt ∈ ndBuff", buffers)).toBe("ndBuff.count({x, pkt}) > 0");
  });
  it("PS2/PS3 pair insert/erase, FN3 function-extend dispatch on enc", () => {
    expect(emit("ndBuff ≔ ndBuff  ∪ {x ↦ pkt}", buffers)).toBe("ndBuff.insert({x, pkt});");
    expect(emit("ndBuff ≔ ndBuff ∖{x↦pkt}", buffers)).toBe("ndBuff.erase({x, pkt});");
    expect(emit("pktFwdr ≔ pktFwdr ∪ {pkt ↦ x}", buffers)).toBe("pktFwdr[pkt] = x;");
  });
  it("PS4/PS5 dom/ran scans on a pair-set", () => {
    expect(emit("x ∈ dom(sentUp)", buffers)).toBe("inDom(sentUp, x)");
    expect(emit("pkt ∈ ran(sentUp)", buffers)).toBe("inRan(sentUp, pkt)");
    expect(emit("pkt ∉ ran(sentDown)", buffers)).toBe("!inRan(sentDown, pkt)");
  });
  it("PS6 range subtraction loop", () => {
    expect(emit("sentUp ≔ sentUp  ⩥ {pkt}", buffers)).toContain("it->second == pkt");
  });
  it("MS5 per-key emptiness, MS6 ran({k}◁M), MS7 product join, MS3 per-key remove", () => {
    expect(emit("{pkt} ◁ctlNeighbours = ∅", buffers))
      .toBe("(ctlNeighbours.count(pkt) == 0 || ctlNeighbours.at(pkt).empty())");
    expect(emit("des = ran({pkt} ◁ finalDestAddr)", buffers)).toBe("des == finalDestAddr.at(pkt)");
    expect(emit("ctlNeighbours ≔ ctlNeighbours ∪({pkt}× nbrs)", buffers))
      .toBe("for (auto _v : nbrs) ctlNeighbours[pkt].insert(_v);");
    expect(emit("ctlNeighbours ≔ ctlNeighbours  ∖ {pkt ↦nb}", buffers))
      .toBe("ctlNeighbours[pkt].erase(nb); if (ctlNeighbours[pkt].empty()) ctlNeighbours.erase(pkt);");
  });
  it("MS1 per-key membership, MS2 per-key insert, MS3 per-key set remove", () => {
    expect(emit("data ∈ senseBuff(x)", buffers))
      .toBe("(senseBuff.count(x) > 0 && senseBuff.at(x).count(data) > 0)");
    expect(emit("senseBuff(x) ≔  senseBuff(x) ∪ {data}", buffers)).toBe("senseBuff[x].insert(data);");
    expect(emit("senseBuff(x) ≔  senseBuff(x) ∖{data}", buffers))
      .toBe("senseBuff[x].erase(data); if (senseBuff[x].empty()) senseBuff.erase(x);");
  });
  it("SET2 insert, FN2 domain, CMP1 set-difference membership", () => {
    expect(emit("createdPkts≔ createdPkts ∪ {pkt}", buffers)).toBe("createdPkts.insert(pkt);");
    expect(emit("pkt ∉ dom(pktFwdr)", buffers)).toBe("pktFwdr.count(pkt) == 0");
    expect(emit("x ∈ ND ∖Dests", buffers)).toBe("(ND.count(x) > 0 && Dests.count(x) == 0)");
  });
  it("FN1∘SET1 membership of a function application (type(pkt) ∈ CONTROL)", () => {
    expect(emit("type(pkt) ∈ CONTROL", buffers)).toBe("CONTROL.count(type.at(pkt)) > 0");
    expect(emit("type(pkt) ∉ CONTROL", buffers)).toBe("CONTROL.count(type.at(pkt)) == 0");
  });
  it("∪ {a↦b} dispatches per encoding: map-of-sets per-key insert", () => {
    expect(emit("ctlNeighbours ≔ ctlNeighbours ∪ {pkt ↦ nb}", buffers))
      .toBe("ctlNeighbours[pkt].insert(nb);");
  });
  it("FN1 application equality, function-value equality, bare set membership, emptiness", () => {
    expect(emit("x = initialSrcAddr(pkt)", buffers)).toBe("x == initialSrcAddr.at(pkt)");
    expect(emit("ctlSensedFlg(x) = FALSE", buffers)).toBe("ctlSensedFlg.at(x) == FALSE");
    expect(emit("nb ∈ Dests", buffers)).toBe("Dests.count(nb) > 0");
    expect(emit("nb ∉ Dests", buffers)).toBe("Dests.count(nb) == 0");
    expect(emit("nbrs ≠ ∅", buffers)).toBe("!nbrs.empty()");
  });
  it("FN3 set-update, relational override (U+E103 glyph and space-degraded), CMP2 total init, clear", () => {
    expect(emit("ctlSensedFlg(x) ≔ sf", buffers)).toBe("ctlSensedFlg[x] = sf;");
    // Real Rodin text: the override operator is private-use U+E103 (as in
    // tests/fixtures/shdecom/pM1.bum start_tx) — and the space-degraded copy.
    expect(emit("pktFwdr ≔pktFwdr  {pkt↦x}", buffers)).toBe("pktFwdr[pkt] = x;");
    expect(emit("pktFwdr ≔pktFwdr  {pkt↦x}", buffers)).toBe("pktFwdr[pkt] = x;");
    expect(emit("ctlSensedFlg ≔ (ND ∖Dests) × {FALSE}", buffers))
      .toBe("for (int _n : ND) if (Dests.count(_n) == 0) ctlSensedFlg[_n] = FALSE;");
    expect(emit("senseBuff ≔ (ND ∖Dests) × {∅}", buffers))
      .toBe("for (int _n : ND) if (Dests.count(_n) == 0) senseBuff[_n] = {};");
    expect(emit("pktFwdr ≔ ∅", buffers)).toBe("pktFwdr.clear();");
  });
});
