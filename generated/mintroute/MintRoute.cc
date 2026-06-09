#include "MintRoute.h"
#include "inet/common/Protocol.h"

Define_Module(MintRoute);

static const Protocol mintrouteProtocol("mintroute", "MintRoute", Protocol::NetworkLayer);

const Protocol& MintRoute::getProtocol() const { return mintrouteProtocol; }

void MintRoute::initialize(int stage) { NetworkProtocolBase::initialize(stage); }
void MintRoute::handleUpperPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
void MintRoute::handleLowerPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
