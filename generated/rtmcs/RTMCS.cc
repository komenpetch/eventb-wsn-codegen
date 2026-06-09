#include "RTMCS.h"

Define_Module(RTMCS);

void RTMCS::initialize(int stage) { NetworkProtocolBase::initialize(stage); }
void RTMCS::handleUpperPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
void RTMCS::handleLowerPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
