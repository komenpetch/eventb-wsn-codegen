import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseModel } from "../src/engine/parser";
import { flatten } from "../src/engine/flattener";
import { resolveEncodings } from "../src/engine/encodingResolver";
import { translateEvent } from "../src/engine/ruleEngine";

const load = (n: string) =>
  ({ name: `${n}.bum`, xml: readFileSync(`tests/fixtures/shdecom/${n}.bum`, "utf8") });

describe("translateEvent", () => {
  const enc = resolveEncodings(flatten(parseModel([load("pM1")]), "pM1"));
  const evOf = (label: string) => enc.events.find((e) => e.label === label)!;

  it("drops typing guards and translates state guards (start_tx)", () => {
    const t = translateEvent(evOf("start_tx"), enc);
    expect(t.guards).toContain("sentDown.count({x, pkt}) == 0");
    expect(t.guards).toContain("pktFwdr.count(pkt) > 0");
    expect(t.guards.some((g) => g.includes("∈ ND"))).toBe(false);   // typing dropped
  });

  it("emits ordered action statements (send_up)", () => {
    const t = translateEvent(evOf("send_up"), enc);
    expect(t.actions).toEqual([
      "for (auto _v : nbrs) ctlNeighbours[pkt].insert(_v);",
      "sentDown.erase({x, pkt});",
      "sentUp.insert({x, pkt});",
    ]);
  });

  it("flags an action-less event as a predicate (send_down)", () => {
    const t = translateEvent(evOf("send_down"), enc);
    expect(t.actions.length).toBe(0);
    expect(t.guards).toContain("sentDown.count({x, pkt}) > 0");
  });
});
