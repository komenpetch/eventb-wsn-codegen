import type { EncodedModel, Fragment, VirtualFileTree, EncodingForm } from "./types";
import ebHelpers from "../assets/eb_helpers.h?raw";

const CPP: Record<EncodingForm, string> = {
  "function": "std::map<int, int>",
  "pair-keyed": "std::map<std::pair<int,int>, int>",
  "map-of-sets": "std::map<int, std::set<int>>",
  "pair-set": "std::set<std::pair<int,int>>",
};

export function emit(model: EncodedModel, _frags: Fragment[]): VirtualFileTree {
  const p = model.protocol;
  const fields = [...model.encodings.entries()]
    .map(([id, form]) => `  ${CPP[form]} ${id};`).join("\n");

  const header = `#pragma once
#include <map>
#include <set>
#include <utility>
#include "eb_helpers.h"
#include "inet/networklayer/base/NetworkProtocolBase.h"

using namespace inet;

class ${p} : public NetworkProtocolBase {
 protected:
${fields}

  void handleUpperPacket(Packet *packet) override;
  void handleLowerPacket(Packet *packet) override;
  void initialize(int stage) override;
};
`;

  const source = `#include "${p}.h"

Define_Module(${p});

void ${p}::initialize(int stage) { NetworkProtocolBase::initialize(stage); }
void ${p}::handleUpperPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
void ${p}::handleLowerPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
`;

  const ned = `simple ${p} like INetworkProtocol {
  gates:
    input transportIn; output transportOut;
    input queueIn;     output queueOut;
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
