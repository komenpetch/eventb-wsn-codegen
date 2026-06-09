import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { parseModel } from "../src/engine/parser";
import { resolveModel } from "../src/engine/model";
import { matchPatterns } from "../src/engine/patternMatcher";
import { resolveEncodings } from "../src/engine/encodingResolver";
import { translate } from "../src/engine/ruleEngine";
import { emit } from "../src/engine/codeEmitter";

function loadDir(dir: string) {
  return readdirSync(dir).filter((f) => /\.(bum|buc)$/.test(f))
    .map((f) => ({ name: f, xml: readFileSync(`${dir}/${f}`, "utf8") }));
}
const model = resolveModel(parseModel(loadDir("tests/fixtures/rtmcs")));
const encoded = resolveEncodings(model, matchPatterns(model));
const tree = emit(encoded, translate(encoded));
const file = (p: string) => tree.find((f) => f.path.endsWith(p))?.content ?? "";

describe("codeEmitter", () => {
  it("emits a NetworkProtocolBase subclass header", () => {
    expect(file("RTMCS.h")).toContain("class RTMCS : public NetworkProtocolBase");
    expect(file("RTMCS.h")).not.toContain("RoutingProtocolBase");
  });
  it("declares fields by encoding form", () => {
    const h = file("RTMCS.h");
    expect(h).toContain("std::map<std::pair<int,int>, int> fwdNextND;");
    expect(h).toContain("std::map<int, std::set<int>> ctlNeighbours;");
    expect(h).toContain("std::set<std::pair<int,int>> sentUp;");
  });
  it("emits .ned, omnetpp.ini, and eb_helpers.h", () => {
    expect(tree.some((f) => f.path.endsWith("RTMCS.ned"))).toBe(true);
    expect(tree.some((f) => f.path.endsWith("omnetpp.ini"))).toBe(true);
    expect(tree.some((f) => f.path.endsWith("eb_helpers.h"))).toBe(true);
  });

  // NetworkProtocolBase leaves getProtocol() pure virtual, and OperationalMixin
  // leaves handleStartOperation/Stop/Crash pure virtual. All four must be
  // overridden or Define_Module instantiates an abstract class and the build
  // fails. (Verified against inet4.5 NetworkProtocolBase.h / OperationalMixin.h.)
  it("overrides every pure virtual so the module is concrete", () => {
    const h = file("RTMCS.h");
    expect(h).toContain("const Protocol& getProtocol() const override");
    expect(h).toContain("void handleStartOperation(LifecycleOperation *operation) override");
    expect(h).toContain("void handleStopOperation(LifecycleOperation *operation) override");
    expect(h).toContain("void handleCrashOperation(LifecycleOperation *operation) override");
  });
  it("implements the INetworkProtocol marker interface from the .ned 'like'", () => {
    expect(file("RTMCS.h")).toContain("public INetworkProtocol");
    expect(file("RTMCS.h")).toContain('#include "inet/networklayer/contract/INetworkProtocol.h"');
  });
  it("registers a Protocol and returns it from getProtocol", () => {
    const cc = file("RTMCS.cc");
    expect(cc).toContain('#include "inet/common/Protocol.h"');
    expect(cc).toMatch(/static const Protocol \w+\("rtmcs", "RTMCS", Protocol::NetworkLayer\);/);
    expect(cc).toMatch(/const Protocol& RTMCS::getProtocol\(\) const \{ return \w+; \}/);
  });
  it("emits an INET-idiomatic .ned that extends NetworkProtocolBase", () => {
    const ned = file("RTMCS.ned");
    expect(ned).toContain("import inet.networklayer.base.NetworkProtocolBase;");
    expect(ned).toContain("simple RTMCS extends NetworkProtocolBase like INetworkProtocol");
    expect(ned).toContain("@class(RTMCS);");
  });
});
