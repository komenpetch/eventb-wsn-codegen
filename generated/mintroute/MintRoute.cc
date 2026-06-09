#include "MintRoute.h"

Define_Module(MintRoute);

void MintRoute::initialize(int stage) { NetworkProtocolBase::initialize(stage); }
void MintRoute::handleUpperPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
void MintRoute::handleLowerPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
