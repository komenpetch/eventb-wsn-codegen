import type { EncodedModel, Fragment, VirtualFileTree, EncodingForm } from "./types";
import ebHelpers from "../assets/eb_helpers.h?raw";

const CPP: Record<EncodingForm, string> = {
  "function": "std::map<int, int>",
  "pair-keyed": "std::map<std::pair<int,int>, int>",
  "map-of-sets": "std::map<int, std::set<int>>",
  "pair-set": "std::set<std::pair<int,int>>",
};

export function emit(model: EncodedModel, frags: Fragment[]): VirtualFileTree {
  const p = model.protocol;
  const lower = p.toLowerCase();
  const fields = [...model.encodings.entries()]
    .map(([id, form]) => `  ${CPP[form]} ${id};`).join("\n");

  // Surface the pattern-matcher and rule-engine output in the generated .cc so
  // it is not silently discarded: a one-line pattern summary plus the distinct
  // translated guard/action fragments as reference for the M4-M6 hand-completion.
  const pat = model.patterns;
  const patternLine =
    `// Detected patterns - CommPattern(packets: ${pat.comm.packetVars.join(", ") || "none"}` +
    `${pat.comm.floodTableVar ? `, flood: ${pat.comm.floodTableVar}` : ""}); ` +
    `RouteTable: ${pat.route ? `${pat.route.kind} (${pat.route.tableVars.join(", ")})` : "none"}; ` +
    `ENVPattern(link: ${pat.env.linkVar ?? "none"}, neighbours: ${pat.env.neighbourVars.join(", ") || "none"}).`;
  const distinctFrags = [...new Map(frags.map((f) => [f.cpp, f])).values()];
  const fragmentBlock = distinctFrags.length
    ? "\n// --- Translated guard/action fragments (rule catalog R*/A*) ---------------\n" +
      "// Reference C++ for the M4-M6 imperative bodies (project Phase 4 hand-completion).\n" +
      distinctFrags.map((f) => `//   [${f.rule}] ${f.sourceExpr}  =>  ${f.cpp}`).join("\n") + "\n"
    : "";

  // NetworkProtocolBase leaves getProtocol() pure virtual, and OperationalMixin
  // (via LayeredProtocolBase) leaves handleStartOperation/Stop/Crash pure
  // virtual. Every one must be overridden or Define_Module instantiates an
  // abstract class and the INET build fails. INetworkProtocol is the C++ side
  // of the .ned `like INetworkProtocol` and is a pure marker interface.
  const header = `#pragma once
#include <map>
#include <set>
#include <utility>
#include "eb_helpers.h"
#include "inet/networklayer/base/NetworkProtocolBase.h"
#include "inet/networklayer/contract/INetworkProtocol.h"

using namespace inet;

class ${p} : public NetworkProtocolBase, public INetworkProtocol {
 protected:
${fields}

  // Protocol identity; defined in the .cc against a file-local Protocol.
  const Protocol& getProtocol() const override;

  void handleUpperPacket(Packet *packet) override;
  void handleLowerPacket(Packet *packet) override;
  void initialize(int stage) override;

  // Lifecycle hooks are pure virtual in OperationalMixin; empty bodies keep the
  // module concrete. Start/stop/crash logic is a project Phase 4 fill-in.
  void handleStartOperation(LifecycleOperation *operation) override {}
  void handleStopOperation(LifecycleOperation *operation) override {}
  void handleCrashOperation(LifecycleOperation *operation) override {}
};
`;

  // The Protocol ctor only rejects names containing a space (inet Protocol.cc),
  // so registering under the lowercased module name is safe to construct.
  const source = `#include "${p}.h"
#include "inet/common/Protocol.h"

${patternLine}

Define_Module(${p});

static const Protocol ${lower}Protocol("${lower}", "${p}", Protocol::NetworkLayer);

const Protocol& ${p}::getProtocol() const { return ${lower}Protocol; }

void ${p}::initialize(int stage) { NetworkProtocolBase::initialize(stage); }
void ${p}::handleUpperPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
void ${p}::handleLowerPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
${fragmentBlock}`;

  // Extending NetworkProtocolBase inherits its transportIn/transportOut and
  // queueIn/queueOut gates plus the required interfaceTableModule parameter;
  // @class binds the NED type to the Define_Module-registered C++ class.
  const ned = `import inet.networklayer.base.NetworkProtocolBase;
import inet.networklayer.contract.INetworkProtocol;

//
// Generated network-layer protocol. Protocol-specific parameters are a project
// Phase 4 fill-in.
//
simple ${p} extends NetworkProtocolBase like INetworkProtocol
{
    parameters:
        @class(${p});
        @display("i=block/fork");
}
`;

  const ini = `[General]
network = WSN
**.numHosts = 10
**.host[*].networkLayer.typename = "${p}"
`;

  return [
    { path: `${p}.h`, content: header },
    { path: `${p}.cc`, content: source },
    { path: `${p}.ned`, content: ned },
    { path: `omnetpp.ini`, content: ini },
    { path: `eb_helpers.h`, content: ebHelpers as string },
  ];
}
