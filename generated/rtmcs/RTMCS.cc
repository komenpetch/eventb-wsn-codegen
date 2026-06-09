#include "RTMCS.h"
#include "inet/common/Protocol.h"

Define_Module(RTMCS);

static const Protocol rtmcsProtocol("rtmcs", "RTMCS", Protocol::NetworkLayer);

const Protocol& RTMCS::getProtocol() const { return rtmcsProtocol; }

void RTMCS::initialize(int stage) { NetworkProtocolBase::initialize(stage); }
void RTMCS::handleUpperPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
void RTMCS::handleLowerPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
