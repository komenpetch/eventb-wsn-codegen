#include "RTMCS.h"
#include "inet/common/Protocol.h"

// Detected patterns - CommPattern(packets: ndBuff, WiMedium, finalDestAddr, flood: floodTbl); RouteTable: pair (fwdRouteTbl, bwdRouteTbl); ENVPattern(link: wsnLinks, neighbours: ctlNeighbours, envNeighbours).

Define_Module(RTMCS);

static const Protocol rtmcsProtocol("rtmcs", "RTMCS", Protocol::NetworkLayer);

const Protocol& RTMCS::getProtocol() const { return rtmcsProtocol; }

void RTMCS::initialize(int stage) { NetworkProtocolBase::initialize(stage); }
void RTMCS::handleUpperPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
void RTMCS::handleLowerPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }

// --- Translated guard/action fragments (rule catalog R*/A*) ---------------
// Reference C++ for the M4-M6 imperative bodies (project Phase 4 hand-completion).
//   [A9] xmittedPkts ≔ ∅  =>  xmittedPkts.clear();
//   [A9] middleware ≔ ∅  =>  middleware.clear();
//   [A10] destBuff ≔  ND × {∅}  =>  destBuff.clear();
//   [A9] finalDestAddr ≔ ∅  =>  finalDestAddr.clear();
//   [A9] lostPkts ≔ ∅  =>  lostPkts.clear();
//   [A7] s = initialSrcAddr(pkt)  =>  int s = initialSrcAddr.at(pkt);
//   [R3] xmittedPkts ≔ xmittedPkts ∪ {pkt}  =>  xmittedPkts.insert(pkt);
//   [R3] middleware ≔  middleware ∪  {pkt}  =>  middleware.insert(pkt);
//   [A8] pkt ∈ dom(finalDestAddr)  =>  finalDestAddr.count(pkt) > 0
//   [A7] des = finalDestAddr(pkt)  =>  int des = finalDestAddr.at(pkt);
//   [A8] des ∈dom(destBuff)  =>  destBuff.count(des) > 0
//   [R16] destBuff(des) ≔ destBuff(des) ∪ {pkt}  =>  destBuff[des].insert(pkt);
//   [A6] pkt ∈ middleware  =>  middleware.count(pkt) > 0
//   [A7] sk = finalDestAddr(pkt)  =>  int sk = finalDestAddr.at(pkt);
//   [R4] middleware ≔  middleware ∖  {pkt}  =>  middleware.erase(pkt);
//   [R3] lostPkts ≔ lostPkts ∪ {pkt}  =>  lostPkts.insert(pkt);
//   [A2] middleware = ∅  =>  middleware.empty()
//   [R14] finalDestAddr ≔  {pkt} ⩤ finalDestAddr  =>  finalDestAddr.erase(pkt);
//   [A9] ndBuff ≔ ∅  =>  ndBuff.clear();
//   [A9] WiMedium ≔ ∅  =>  WiMedium.clear();
//   [A9] sensingNDs ≔ ∅  =>  sensingNDs.clear();
//   [A9] sensedPkts ≔ ∅  =>  sensedPkts.clear();
//   [A9] floodedPkts ≔ ∅  =>  floodedPkts.clear();
//   [A10] floodTbl ≔ ND × {∅}  =>  floodTbl.clear();
//   [A9] ctlNeighbours ≔ ∅  =>  ctlNeighbours.clear();
//   [A9] recLostPkts ≔ ∅  =>  recLostPkts.clear();
//   [A6] s ∉ sensingNDs  =>  sensingNDs.count(s) == 0
//   [A8] s ∈ dom(floodTbl)  =>  floodTbl.count(s) > 0
//   [R15] pkt ∉ floodTbl(s)  =>  (floodTbl.count(s) == 0 || floodTbl.at(s).count(pkt) == 0)
//   [R3] sensingNDs ≔ sensingNDs ∪ {s}  =>  sensingNDs.insert(s);
//   [R3] sensedPkts ≔ sensedPkts ∪ {pkt}  =>  sensedPkts.insert(pkt);
//   [R16] floodTbl(s) ≔  floodTbl(s) ∪ {pkt}  =>  floodTbl[s].insert(pkt);
//   [A8] x ∈ dom(floodFlg)  =>  floodFlg.count(x) > 0
//   [R1] type(pkt)∈ CONTROL  =>  CONTROL.count(getType(pkt)) > 0
//   [R3] floodedPkts ≔ floodedPkts ∪ {pkt}  =>  floodedPkts.insert(pkt);
//   [A3] pkt ∈ ran(WiMedium) ∖ ran(recLostPkts)  =>  eb_in_range(WiMedium, pkt)
//   [A2] nbrs ≠ ∅  =>  !nbrs.empty()
//   [R15] pkt ∉ dom(ctlNeighbours)  =>  (dom.count(ctlNeighbours) == 0 || dom.at(ctlNeighbours).count(pkt) == 0)
//   [A8] nb ∈ dom(floodTbl)  =>  floodTbl.count(nb) > 0
//   [R15] pkt ∉ floodTbl(nb)  =>  (floodTbl.count(nb) == 0 || floodTbl.at(nb).count(pkt) == 0)
//   [R16] floodTbl(nb) ≔  floodTbl(nb) ∪ {pkt}  =>  floodTbl[nb].insert(pkt);
//   [A8] pkt ∈ dom(ctlNeighbours)  =>  ctlNeighbours.count(pkt) > 0
//   [R11] {pkt} ◁ ctlNeighbours ≠ ∅  =>  (ctlNeighbours.count(pkt) > 0 && !ctlNeighbours.at(pkt).empty())
//   [R16] floodTbl(des) ≔  floodTbl(des) ∪ {pkt}  =>  floodTbl[des].insert(pkt);
//   [R11] {pkt} ◁ctlNeighbours = ∅  =>  (ctlNeighbours.count(pkt) == 0 || ctlNeighbours.at(pkt).empty())
//   [A3] pkt ∈ ran(ndBuff)  =>  eb_in_range(ndBuff, pkt)
//   [R15] pkt ∉ ran(ndBuff)  =>  (ran.count(ndBuff) == 0 || ran.at(ndBuff).count(pkt) == 0)
//   [A2] WiMedium = ∅  =>  WiMedium.empty()
//   [A2] ndBuff = ∅  =>  ndBuff.empty()
//   [A10] recvedData ≔ Destination × {∅}  =>  recvedData.clear();
//   [A9] pktData ≔ ∅  =>  pktData.clear();
//   [A9] vPktData ≔ ∅  =>  vPktData.clear();
//   [A7] sf = envSensedFlg(x)  =>  int sf = envSensedFlg.at(x);
//   [A7] sd = envData(x)  =>  int sd = envData.at(x);
//   [R16] senseBuff(x) ≔  senseBuff(x) ∪ {sd}  =>  senseBuff[x].insert(sd);
//   [A8] x ∈ dom(envSensedFlg)  =>  envSensedFlg.count(x) > 0
//   [A8] s ∈ dom(senseBuff)  =>  senseBuff.count(s) > 0
//   [A2] senseBuff ≠ ∅  =>  !senseBuff.empty()
//   [R15] pkt ∉ dom(pktData)  =>  (dom.count(pktData) == 0 || dom.at(pktData).count(pkt) == 0)
//   [R15] pkt ∉ dom(vPktData)  =>  (dom.count(vPktData) == 0 || dom.at(vPktData).count(pkt) == 0)
//   [A8] pkt ∈ dom(pktData)  =>  pktData.count(pkt) > 0
//   [A7] data = pktData(pkt)  =>  int data = pktData.at(pkt);
//   [R14] pktData ≔  {pkt} ⩤ pktData  =>  pktData.erase(pkt);
//   [A8] pkt ∈ dom(vPktData)  =>  vPktData.count(pkt) > 0
//   [A7] data = vPktData(pkt)  =>  int data = vPktData.at(pkt);
//   [R14] vPktData ≔  {pkt} ⩤ vPktData  =>  vPktData.erase(pkt);
//   [A8] des ∈ dom(recvedData)  =>  recvedData.count(des) > 0
//   [R16] recvedData(des) ≔ recvedData(des) ∪ {data}  =>  recvedData[des].insert(data);
//   [A8] act ∈ dom(recvedData)  =>  recvedData.count(act) > 0
//   [A8] act ∈ dom(emergencyAlert)  =>  emergencyAlert.count(act) > 0
//   [A9] sentUp≔ ∅  =>  sentUp.clear();
//   [A9] sentDown≔ ∅  =>  sentDown.clear();
//   [A9] channel ≔ ∅  =>  channel.clear();
//   [A9] envNeighbours ≔ ∅  =>  envNeighbours.clear();
//   [A9] wsnLinks ≔ ∅  =>  wsnLinks.clear();
//   [A9] crashedLinks ≔ ∅  =>  crashedLinks.clear();
//   [A9] nbHops ≔ ∅  =>  nbHops.clear();
//   [A9] pktSeqNo ≔ ∅  =>  pktSeqNo.clear();
//   [A9] pktSrc ≔ ∅  =>  pktSrc.clear();
//   [A9] pktFwdr ≔ ∅  =>  pktFwdr.clear();
//   [A9] pktNbHops ≔ ∅  =>  pktNbHops.clear();
//   [A9] vPktSeqNo ≔ ∅  =>  vPktSeqNo.clear();
//   [A9] vPktSrc ≔ ∅  =>  vPktSrc.clear();
//   [A9] vPktFwdr ≔ ∅  =>  vPktFwdr.clear();
//   [A9] vPktNbHops ≔ ∅  =>  vPktNbHops.clear();
//   [A8] s ∈ dom(dataSeqNo)  =>  dataSeqNo.count(s) > 0
//   [R15] pkt  ∉ dom(pktSeqNo)  =>  (dom.count(pktSeqNo) == 0 || dom.at(pktSeqNo).count(pkt) == 0)
//   [R15] pkt ∉ dom(pktSrc)  =>  (dom.count(pktSrc) == 0 || dom.at(pktSrc).count(pkt) == 0)
//   [R15] pkt ∉ dom(pktFwdr)  =>  (dom.count(pktFwdr) == 0 || dom.at(pktFwdr).count(pkt) == 0)
//   [R15] pkt ∉ dom(pktNbHops)  =>  (dom.count(pktNbHops) == 0 || dom.at(pktNbHops).count(pkt) == 0)
//   [R13] nbHops ≔  nbHops ∪ {s ↦ {pkt ↦ nbh}}  =>  nbHops[s][pkt] = nbh;
//   [A8] s ∈ dom(floodSeqNo)  =>  floodSeqNo.count(s) > 0
//   [A8] pkt ∈ dom(pktFwdr)  =>  pktFwdr.count(pkt) > 0
//   [A8] pkt∈dom(pktNbHops)  =>  pktNbHops.count(pkt) > 0
//   [A8] pkt ∈ dom(pktSeqNo)  =>  pktSeqNo.count(pkt) > 0
//   [A7] sno = pktSeqNo(pkt)  =>  int sno = pktSeqNo.at(pkt);
//   [A8] pkt ∈ dom(pktSrc)  =>  pktSrc.count(pkt) > 0
//   [A7] src= pktSrc(pkt)  =>  int src = pktSrc.at(pkt);
//   [A7] fwdr = pktFwdr(pkt)  =>  int fwdr = pktFwdr.at(pkt);
//   [A7] nbh = pktNbHops(pkt)  =>  int nbh = pktNbHops.at(pkt);
//   [R15] pkt ∉ dom(vPktSeqNo)  =>  (dom.count(vPktSeqNo) == 0 || dom.at(vPktSeqNo).count(pkt) == 0)
//   [R15] pkt ∉ dom(vPktFwdr)  =>  (dom.count(vPktFwdr) == 0 || dom.at(vPktFwdr).count(pkt) == 0)
//   [R15] pkt ∉ dom(vPktSrc)  =>  (dom.count(vPktSrc) == 0 || dom.at(vPktSrc).count(pkt) == 0)
//   [R15] pkt ∉ dom(vPktNbHops)  =>  (dom.count(vPktNbHops) == 0 || dom.at(vPktNbHops).count(pkt) == 0)
//   [R14] pktSeqNo ≔  {pkt} ⩤ pktSeqNo  =>  pktSeqNo.erase(pkt);
//   [R14] pktSrc ≔  {pkt} ⩤ pktSrc  =>  pktSrc.erase(pkt);
//   [R14] pktFwdr ≔  {pkt} ⩤ pktFwdr  =>  pktFwdr.erase(pkt);
//   [R14] pktNbHops ≔  {pkt} ⩤ pktNbHops  =>  pktNbHops.erase(pkt);
//   [A2] channel ≠ ∅  =>  !channel.empty()
//   [A3] pkt ∈ ran(channel)  =>  eb_in_range(channel, pkt)
//   [R7] nbs = wsnLinks[{f}]  =>  const std::set<int>& nbs = wsnLinks.at(f);
//   [A2] nbs ≠ ∅  =>  !nbs.empty()
//   [A2] envNeighbours = ∅  =>  envNeighbours.empty()
//   [A6] nb ∈ nbs  =>  nbs.count(nb) > 0
//   [A2] nbs = ∅  =>  nbs.empty()
//   [A3] pkt ∈ ran(sentDown)  =>  eb_in_range(sentDown, pkt)
//   [R6] nbrs = ran({pkt} ◁ envNeighbours)  =>  const std::set<int>& nbrs = envNeighbours.at(pkt);
//   [A8] pkt ∈ dom(vPktSeqNo)  =>  vPktSeqNo.count(pkt) > 0
//   [A7] sno = vPktSeqNo(pkt)  =>  int sno = vPktSeqNo.at(pkt);
//   [A8] pkt ∈ dom(vPktSrc)  =>  vPktSrc.count(pkt) > 0
//   [A7] src = vPktSrc(pkt)  =>  int src = vPktSrc.at(pkt);
//   [A8] pkt ∈ dom(vPktFwdr)  =>  vPktFwdr.count(pkt) > 0
//   [A7] fwdr = vPktFwdr(pkt)  =>  int fwdr = vPktFwdr.at(pkt);
//   [A8] pkt ∈ dom(vPktNbHops)  =>  vPktNbHops.count(pkt) > 0
//   [A7] nbh = vPktNbHops(pkt)  =>  int nbh = vPktNbHops.at(pkt);
//   [R14] vPktSeqNo ≔  {pkt} ⩤ vPktSeqNo  =>  vPktSeqNo.erase(pkt);
//   [R14] vPktSrc ≔  {pkt} ⩤ vPktSrc  =>  vPktSrc.erase(pkt);
//   [R14] vPktFwdr ≔  {pkt} ⩤ vPktFwdr  =>  vPktFwdr.erase(pkt);
//   [R14] vPktNbHops ≔  {pkt} ⩤ vPktNbHops  =>  vPktNbHops.erase(pkt);
//   [R10] pkt ∈ ran(sentUp ∪ sentDown)  =>  eb_in_range_union(sentUp, sentDown, pkt)
//   [R12] nb ∉ dom(sentUp ∪ sentDown)  =>  !eb_in_dom_union_pairset(sentUp, sentDown, nb)
//   [R13] nbHops ≔  nbHops ∪  {nb ↦ {pkt ↦ nbh}}  =>  nbHops[nb][pkt] = nbh;
//   [A5] pkt ∈ ran(sentUp ∪ sentDown)∖destBuff(des)  =>  eb_in_range_union(sentUp, sentDown, pkt) && destBuff.at(des).count(pkt) == 0
//   [A3] pkt ∈ ran(sentUp)  =>  eb_in_range(sentUp, pkt)
//   [R15] pkt ∉ ran(sentDown)  =>  (ran.count(sentDown) == 0 || ran.at(sentDown).count(pkt) == 0)
//   [R15] pkt ∉ ran(recLostPkts)  =>  (ran.count(recLostPkts) == 0 || ran.at(recLostPkts).count(pkt) == 0)
//   [A9] bwdRouteTbl ≔ ∅  =>  bwdRouteTbl.clear();
//   [A9] bwdSeqNo ≔ ∅  =>  bwdSeqNo.clear();
//   [A9] bwdNextND ≔ ∅  =>  bwdNextND.clear();
//   [A9] bwdHopCnt ≔ ∅  =>  bwdHopCnt.clear();
//   [A9] updateNbrs ≔ ∅  =>  updateNbrs.clear();
//   [A8] x ∈ dom(linkSeqNo)  =>  linkSeqNo.count(x) > 0
//   [A2] updateNbrs ≠ ∅  =>  !updateNbrs.empty()
//   [A8] pkt ∈ dom(initialSrcAddr)  =>  initialSrcAddr.count(pkt) > 0
//   [A7] sNo = netSeqNo(pkt)  =>  int sNo = netSeqNo.at(pkt);
//   [A2] ctlNeighbours = ∅  =>  ctlNeighbours.empty()
//   [A9] fwdRouteTbl ≔ ∅  =>  fwdRouteTbl.clear();
//   [A9] fwdSeqNo ≔ ∅  =>  fwdSeqNo.clear();
//   [A9] fwdNextND ≔ ∅  =>  fwdNextND.clear();
//   [A9] fwdHopCnt ≔ ∅  =>  fwdHopCnt.clear();
//   [A9] rrepLists ≔ ∅  =>  rrepLists.clear();
//   [A9] netDestAddr ≔ ∅  =>  netDestAddr.clear();
//   [A9] envDestAddr ≔ ∅  =>  envDestAddr.clear();
//   [R15] pkt ∉ dom(netDestAddr)  =>  (dom.count(netDestAddr) == 0 || dom.at(netDestAddr).count(pkt) == 0)
//   [A8] x ∈ dom(rrepLists)  =>  eb_in_dom_pairset(rrepLists, x)
//   [A7] fDes = initialSrcAddr(rreq)  =>  int fDes = initialSrcAddr.at(rreq);
//   [R17] s ∈ran({x}◁dom(fwdNextND))  =>  domRestrictedRange(fwdNextND, x).count(s) > 0
//   [R18] nxt = fwdNextND(x↦s)  =>  int nxt = tupleApply(fwdNextND, x, s);
//   [A8] x ∈ dom(rrepSeqNo)  =>  rrepSeqNo.count(x) > 0
//   [R2] x↦s ∈ dom(bwdNextND)  =>  bwdNextND.find({x, s}) != bwdNextND.end()
//   [R18] nxt = bwdNextND(x↦s)  =>  int nxt = tupleApply(bwdNextND, x, s);
//   [A8] pkt ∈ dom(netDestAddr)  =>  netDestAddr.count(pkt) > 0
//   [A7] s = finalDestAddr(pkt)  =>  int s = finalDestAddr.at(pkt);
//   [A7] nxt=netDestAddr(pkt)  =>  int nxt = netDestAddr.at(pkt);
//   [R15] pkt ∉ dom(envDestAddr)  =>  (dom.count(envDestAddr) == 0 || dom.at(envDestAddr).count(pkt) == 0)
//   [R14] netDestAddr ≔  {pkt} ⩤ netDestAddr  =>  netDestAddr.erase(pkt);
//   [A9] rrerLists ≔  ∅  =>  rrerLists.clear();
//   [A9] pktErrND ≔ ∅  =>  pktErrND.clear();
//   [A9] errND ≔ ∅  =>  errND.clear();
//   [A8] rrer ∈ dom(initialSrcAddr)  =>  initialSrcAddr.count(rrer) > 0
//   [A7] fDes = initialSrcAddr(rrer)  =>  int fDes = initialSrcAddr.at(rrer);
//   [R15] pkt ∉ dom(pktErrND)  =>  (dom.count(pktErrND) == 0 || dom.at(pktErrND).count(pkt) == 0)
//   [A7] fDes = finalDestAddr(pkt)  =>  int fDes = finalDestAddr.at(pkt);
//   [R17] fDes∈ran({x}◁dom(bwdNextND))  =>  domRestrictedRange(bwdNextND, x).count(fDes) > 0
//   [R18] nxt = bwdNextND(x↦fDes)  =>  int nxt = tupleApply(bwdNextND, x, fDes);
//   [A6] nxt ∉ nbs  =>  nbs.count(nxt) == 0
