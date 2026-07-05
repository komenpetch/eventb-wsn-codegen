import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseModel } from "../src/engine/parser";
import { flatten } from "../src/engine/flattener";
import { resolveEncodings } from "../src/engine/encodingResolver";
import { emit } from "../src/engine/codeEmitter";

const load = (n: string) =>
  ({ name: `${n}.bum`, xml: readFileSync(`tests/fixtures/shdecom/${n}.bum`, "utf8") });
const gen = (target: string, files: string[], name: string) =>
  emit(resolveEncodings(flatten(parseModel(files.map(load)), target)), name);

describe("codeEmitter", () => {
  const tree = gen("pM1", ["pM1"], "Pm1App");
  const file = (ext: string) => tree.find((f) => f.path === `Pm1App.${ext}`)!.content;

  it("emits exactly three files named after the output name", () => {
    expect(tree.map((f) => f.path).sort()).toEqual(["Pm1App.cc", "Pm1App.h", "Pm1App.ned"]);
  });
  it("declares ENC-typed state fields", () => {
    const h = file("h");
    expect(h).toContain("std::set<std::pair<Node, PktId>> sentUp");
    expect(h).toContain("std::map<PktId, std::set<Node>> ctlNeighbours");
    expect(h).toContain("std::set<PktId> createdPkts");
    expect(h).toContain("std::map<PktId, Node> pktFwdr");
  });
  it("wraps the class in RoutingProtocolBase with the OperationalBase override set", () => {
    const h = file("h");
    expect(h).toContain("class Pm1App : public RoutingProtocolBase");
    expect(h).toContain("void handleMessageWhenUp(cMessage *msg) override");
  });
  it("emits a guarded method per event with early-return guards", () => {
    const cc = file("cc");
    expect(cc).toMatch(/bool Pm1App::start_tx\([^)]*\)\s*\{/);
    expect(cc).toContain("if (!(sentDown.count({x, pkt}) == 0)) return false;");
    expect(cc).toContain("return true;");
  });
  it("renders an action-less event as a bool predicate (send_down)", () => {
    const cc = file("cc");
    expect(cc).toMatch(/bool Pm1App::send_down\([^)]*\)\s*\{\s*return [^;]+;\s*\}/);
  });
  it("emits a NED-resolvable module: standalone simple like IApp, class bound via @class", () => {
    const ned = file("ned");
    // RoutingProtocolBase has no NED type in INET 4.5 — extending it would
    // fail NED resolution; the C++ base is bound with @class instead.
    expect(ned).not.toContain("extends RoutingProtocolBase");
    expect(ned).toContain("simple Pm1App like IApp");
    expect(ned).toContain("@class(Pm1App)");
    expect(ned).toContain("input socketIn");
    expect(ned).toContain("output socketOut");
  });
});
