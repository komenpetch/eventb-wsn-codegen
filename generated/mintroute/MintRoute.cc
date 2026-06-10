#include "MintRoute.h"
#include "inet/common/Protocol.h"

// Detected patterns - CommPattern(packets: ndBuff, WiMedium, flood: floodTbl); RouteTable: single (neighbourTbl); ENVPattern(link: wsnLinks, neighbours: ctlNeighbours, envNeighbours).

Define_Module(MintRoute);

static const Protocol mintrouteProtocol("mintroute", "MintRoute", Protocol::NetworkLayer);

const Protocol& MintRoute::getProtocol() const { return mintrouteProtocol; }

void MintRoute::initialize(int stage) { NetworkProtocolBase::initialize(stage); }
void MintRoute::handleUpperPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }
void MintRoute::handleLowerPacket(Packet *packet) { /* M4-M6 event bodies: project Phase 4 */ }

// --- Translated guard/action fragments (rule catalog R*/A*) ---------------
// Reference C++ for the M4-M6 imperative bodies (project Phase 4 hand-completion).
//   [A9] xmittedPkts ≔ ∅  =>  xmittedPkts.clear();
//   [A9] middleware ≔ ∅  =>  middleware.clear();
//   [A9] sinkBuff ≔  ∅  =>  sinkBuff.clear();
//   [A9] lostPkts ≔ ∅  =>  lostPkts.clear();
//   [A6] pkt ∉ xmittedPkts  =>  xmittedPkts.count(pkt) == 0
//   [A6] pkt ∉ middleware  =>  middleware.count(pkt) == 0
//   [A7] s = initialSrcAddr(pkt)  =>  int s = initialSrcAddr.at(pkt);
//   [R3] xmittedPkts ≔ xmittedPkts ∪ {pkt}  =>  xmittedPkts.insert(pkt);
//   [R3] middleware ≔  middleware ∪  {pkt}  =>  middleware.insert(pkt);
//   [R3] sinkBuff ≔ sinkBuff ∪ {pkt}  =>  sinkBuff.insert(pkt);
//   [A6] pkt ∈ middleware  =>  middleware.count(pkt) > 0
//   [R4] middleware ≔  middleware ∖  {pkt}  =>  middleware.erase(pkt);
//   [R3] lostPkts ≔ lostPkts ∪ {pkt}  =>  lostPkts.insert(pkt);
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
//   [A6] pkt ∉ sinkBuff  =>  sinkBuff.count(pkt) == 0
//   [R15] pkt ∉ ran(recLostPkts)  =>  (ran.count(recLostPkts) == 0 || ran.at(recLostPkts).count(pkt) == 0)
//   [R3] sensingNDs ≔ sensingNDs ∪ {s}  =>  sensingNDs.insert(s);
//   [R3] sensedPkts ≔ sensedPkts ∪ {pkt}  =>  sensedPkts.insert(pkt);
//   [R16] floodTbl(s) ≔  floodTbl(s) ∪ {pkt}  =>  floodTbl[s].insert(pkt);
//   [A8] x ∈ dom(floodFlg)  =>  floodFlg.count(x) > 0
//   [R1] type(pkt) ∈ CONTROL  =>  CONTROL.count(getType(pkt)) > 0
//   [R3] floodedPkts ≔ floodedPkts ∪ {pkt}  =>  floodedPkts.insert(pkt);
//   [A3] pkt ∈ ran(WiMedium) ∖ ran(recLostPkts)  =>  eb_in_range(WiMedium, pkt)
//   [A2] nbrs ≠ ∅  =>  !nbrs.empty()
//   [R15] pkt ∉ dom(ctlNeighbours)  =>  (dom.count(ctlNeighbours) == 0 || dom.at(ctlNeighbours).count(pkt) == 0)
//   [A8] nb ∈ dom(floodTbl)  =>  floodTbl.count(nb) > 0
//   [R15] pkt ∉ floodTbl(nb)  =>  (floodTbl.count(nb) == 0 || floodTbl.at(nb).count(pkt) == 0)
//   [R16] floodTbl(nb) ≔  floodTbl(nb) ∪ {pkt}  =>  floodTbl[nb].insert(pkt);
//   [A8] pkt ∈ dom(ctlNeighbours)  =>  ctlNeighbours.count(pkt) > 0
//   [R11] {pkt} ◁ctlNeighbours = ∅  =>  (ctlNeighbours.count(pkt) == 0 || ctlNeighbours.at(pkt).empty())
//   [A3] pkt ∈ ran(ndBuff)  =>  eb_in_range(ndBuff, pkt)
//   [A8] f ∈ dom(WiMedium)  =>  eb_in_dom_pairset(WiMedium, f)
//   [R15] pkt ∉ ran(ndBuff)  =>  (ran.count(ndBuff) == 0 || ran.at(ndBuff).count(pkt) == 0)
//   [A6] pkt ∉ sensedPkts  =>  sensedPkts.count(pkt) == 0
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
//   [A9] pktData ≔ ∅  =>  pktData.clear();
//   [A9] pktNbHops ≔ ∅  =>  pktNbHops.clear();
//   [A9] vPktSeqNo ≔ ∅  =>  vPktSeqNo.clear();
//   [A9] vPktSrc ≔ ∅  =>  vPktSrc.clear();
//   [A9] vPktFwdr ≔ ∅  =>  vPktFwdr.clear();
//   [A9] vPktData ≔ ∅  =>  vPktData.clear();
//   [A9] vPktNbHops ≔ ∅  =>  vPktNbHops.clear();
//   [A7] sf = envSensedFlg(x)  =>  int sf = envSensedFlg.at(x);
//   [A7] sd = envData(x)  =>  int sd = envData.at(x);
//   [R16] senseBuff(x) ≔  senseBuff(x) ∪ {sd}  =>  senseBuff[x].insert(sd);
//   [A8] x ∈ dom(envSensedFlg)  =>  envSensedFlg.count(x) > 0
//   [A2] ndBuff = ∅  =>  ndBuff.empty()
//   [A2] senseBuff ≠ ∅  =>  !senseBuff.empty()
//   [A8] s ∈ dom(dataSeqNo)  =>  dataSeqNo.count(s) > 0
//   [R15] pkt  ∉ dom(pktSeqNo)  =>  (dom.count(pktSeqNo) == 0 || dom.at(pktSeqNo).count(pkt) == 0)
//   [R15] pkt ∉ dom(pktSrc)  =>  (dom.count(pktSrc) == 0 || dom.at(pktSrc).count(pkt) == 0)
//   [R15] pkt ∉ dom(pktFwdr)  =>  (dom.count(pktFwdr) == 0 || dom.at(pktFwdr).count(pkt) == 0)
//   [R15] pkt ∉ dom(pktData)  =>  (dom.count(pktData) == 0 || dom.at(pktData).count(pkt) == 0)
//   [R15] pkt ∉ dom(pktNbHops)  =>  (dom.count(pktNbHops) == 0 || dom.at(pktNbHops).count(pkt) == 0)
//   [R13] nbHops ≔  nbHops ∪ {s ↦ {pkt ↦ nbh}}  =>  nbHops[s][pkt] = nbh;
//   [A8] s ∈ dom(floodSeqNo)  =>  floodSeqNo.count(s) > 0
//   [A8] pkt ∈ dom(pktFwdr)  =>  pktFwdr.count(pkt) > 0
//   [A8] pkt ∈ dom(pktNbHops)  =>  pktNbHops.count(pkt) > 0
//   [A8] pkt ∈ dom(pktSeqNo)  =>  pktSeqNo.count(pkt) > 0
//   [A7] sno = pktSeqNo(pkt)  =>  int sno = pktSeqNo.at(pkt);
//   [A8] pkt ∈ dom(pktSrc)  =>  pktSrc.count(pkt) > 0
//   [A7] src= pktSrc(pkt)  =>  int src = pktSrc.at(pkt);
//   [A7] fwdr = pktFwdr(pkt)  =>  int fwdr = pktFwdr.at(pkt);
//   [A8] pkt ∈ dom(pktData)  =>  pktData.count(pkt) > 0
//   [A7] data = pktData(pkt)  =>  int data = pktData.at(pkt);
//   [A7] nbh = pktNbHops(pkt)  =>  int nbh = pktNbHops.at(pkt);
//   [R15] pkt ∉ dom(vPktSeqNo)  =>  (dom.count(vPktSeqNo) == 0 || dom.at(vPktSeqNo).count(pkt) == 0)
//   [R15] pkt ∉ dom(vPktFwdr)  =>  (dom.count(vPktFwdr) == 0 || dom.at(vPktFwdr).count(pkt) == 0)
//   [R15] pkt ∉ dom(vPktSrc)  =>  (dom.count(vPktSrc) == 0 || dom.at(vPktSrc).count(pkt) == 0)
//   [R15] pkt ∉ dom(vPktData)  =>  (dom.count(vPktData) == 0 || dom.at(vPktData).count(pkt) == 0)
//   [R15] pkt ∉ dom(vPktNbHops)  =>  (dom.count(vPktNbHops) == 0 || dom.at(vPktNbHops).count(pkt) == 0)
//   [R14] pktSeqNo ≔  {pkt} ⩤ pktSeqNo  =>  pktSeqNo.erase(pkt);
//   [R14] pktSrc ≔  {pkt} ⩤ pktSrc  =>  pktSrc.erase(pkt);
//   [R14] pktFwdr ≔ {pkt}  ⩤ pktFwdr  =>  pktFwdr.erase(pkt);
//   [R14] pktData ≔  {pkt} ⩤ pktData  =>  pktData.erase(pkt);
//   [R14] pktNbHops ≔  {pkt} ⩤ pktNbHops  =>  pktNbHops.erase(pkt);
//   [A2] channel ≠ ∅  =>  !channel.empty()
//   [A3] pkt ∈ ran(channel)  =>  eb_in_range(channel, pkt)
//   [R7] nbs = wsnLinks[{f}]  =>  const std::set<int>& nbs = wsnLinks.at(f);
//   [A2] nbs ≠ ∅  =>  !nbs.empty()
//   [A2] envNeighbours = ∅  =>  envNeighbours.empty()
//   [A6] nb ∈ nbs  =>  nbs.count(nb) > 0
//   [A3] pkt ∈ ran(sentDown)  =>  eb_in_range(sentDown, pkt)
//   [R6] nbrs = ran({pkt} ◁ envNeighbours)  =>  const std::set<int>& nbrs = envNeighbours.at(pkt);
//   [A8] pkt ∈ dom(vPktSeqNo)  =>  vPktSeqNo.count(pkt) > 0
//   [A7] sno = vPktSeqNo(pkt)  =>  int sno = vPktSeqNo.at(pkt);
//   [A8] pkt ∈ dom(vPktSrc)  =>  vPktSrc.count(pkt) > 0
//   [A7] src = vPktSrc(pkt)  =>  int src = vPktSrc.at(pkt);
//   [A8] pkt ∈ dom(vPktFwdr)  =>  vPktFwdr.count(pkt) > 0
//   [A7] fwdr = vPktFwdr(pkt)  =>  int fwdr = vPktFwdr.at(pkt);
//   [A8] pkt ∈ dom(vPktData)  =>  vPktData.count(pkt) > 0
//   [A7] data= vPktData(pkt)  =>  int data = vPktData.at(pkt);
//   [A8] pkt ∈ dom(vPktNbHops)  =>  vPktNbHops.count(pkt) > 0
//   [A7] nbh = vPktNbHops(pkt)  =>  int nbh = vPktNbHops.at(pkt);
//   [R14] vPktSeqNo ≔  {pkt} ⩤ vPktSeqNo  =>  vPktSeqNo.erase(pkt);
//   [R14] vPktSrc ≔  {pkt} ⩤ vPktSrc  =>  vPktSrc.erase(pkt);
//   [R14] vPktFwdr ≔  {pkt} ⩤ vPktFwdr  =>  vPktFwdr.erase(pkt);
//   [R14] vPktData ≔  {pkt} ⩤ vPktData  =>  vPktData.erase(pkt);
//   [R14] vPktNbHops ≔  {pkt} ⩤ vPktNbHops  =>  vPktNbHops.erase(pkt);
//   [R15] pkt ∉ ran(sentDown)  =>  (ran.count(sentDown) == 0 || ran.at(sentDown).count(pkt) == 0)
//   [A3] pkt ∈  ran(sentUp)  =>  eb_in_range(sentUp, pkt)
//   [R13] nbHops ≔  nbHops ∪  {nb ↦ {pkt ↦ nbh}}  =>  nbHops[nb][pkt] = nbh;
//   [A8] f ∈ dom(sentUp)  =>  eb_in_dom_pairset(sentUp, f)
//   [A2] nbs = ∅  =>  nbs.empty()
//   [A9] updateNbrs ≔ ∅  =>  updateNbrs.clear();
//   [A9] neighbourTbl ≔ ∅  =>  neighbourTbl.clear();
//   [A9] missed ≔ ∅  =>  missed.clear();
//   [A9] received ≔ ∅  =>  received.clear();
//   [A9] lastSeqno ≔ ∅  =>  lastSeqno.clear();
//   [A9] receiveEst ≔ ∅  =>  receiveEst.clear();
//   [A9] estNDs ≔ ∅  =>  estNDs.clear();
//   [A9] estNbrs ≔ ∅  =>  estNbrs.clear();
//   [A8] x ∈ dom(totalSentBcon)  =>  totalSentBcon.count(x) > 0
//   [A8] x ∈ dom(linkSeqNo)  =>  linkSeqNo.count(x) > 0
//   [A7] f = pktFwdr(pkt)  =>  int f = pktFwdr.at(pkt);
//   [A2] updateNbrs ≠ ∅  =>  !updateNbrs.empty()
//   [A7] sNo = netSeqNo(pkt)  =>  int sNo = netSeqNo.at(pkt);
//   [R3] estNDs ≔ estNDs ∪ {x}  =>  estNDs.insert(x);
//   [A6] nd ∈ estNDs  =>  estNDs.count(nd) > 0
//   [A8] nd ∈ dom(totalSentBcon)  =>  totalSentBcon.count(nd) > 0
//   [R2] nd ↦ nb ∈ dom(lastSeqno)  =>  lastSeqno.find({nd, nb}) != lastSeqno.end()
//   [R18] r = received(nd ↦ nb)  =>  int r = tupleApply(received, nd, nb);
//   [R18] m = missed(nd↦nb)  =>  int m = tupleApply(missed, nd, nb);
//   [R2] nd ↦ nb∈dom(receiveEst)  =>  receiveEst.find({nd, nb}) != receiveEst.end()
//   [R2] nd ↦ nb∈dom(missed)  =>  missed.find({nd, nb}) != missed.end()
//   [R2] nd ↦ nb∈dom(received)  =>  received.find({nd, nb}) != received.end()
//   [A2] totalSentBcon ≠ ∅  =>  !totalSentBcon.empty()
//   [A9] sentEst ≔ ∅  =>  sentEst.clear();
//   [A9] bcastRouNodes ≔  ∅  =>  bcastRouNodes.clear();
//   [A9] liveliness ≔ ∅  =>  liveliness.clear();
//   [A9] checkedLiveNbrs ≔ ∅  =>  checkedLiveNbrs.clear();
//   [A2] checkedLiveNbrs = ∅  =>  checkedLiveNbrs.empty()
//   [A6] s ∉ bcastRouNodes  =>  bcastRouNodes.count(s) == 0
//   [R3] bcastRouNodes ≔ bcastRouNodes ∪ {s}  =>  bcastRouNodes.insert(s);
//   [A8] x ∈ dom(routeSeqNo)  =>  routeSeqNo.count(x) > 0
//   [R2] y ↦ x ∈ dom(sentEst)  =>  sentEst.find({y, x}) != sentEst.end()
//   [R2] x ↦ y ∈ dom(receiveEst)  =>  receiveEst.find({x, y}) != receiveEst.end()
//   [R2] y ↦ x   ∈ dom(liveliness)  =>  liveliness.find({y, x}) != liveliness.end()
//   [R2] x ↦ y  ∈  dom(liveliness)  =>  liveliness.find({x, y}) != liveliness.end()
//   [R18] live = liveliness(x↦y)  =>  int live = tupleApply(liveliness, x, y);
//   [A9] cRouteTree ≔ ∅  =>  cRouteTree.clear();
//   [A9] Nbrs≔ ∅  =>  Nbrs.clear();
//   [A9] calPCostNDs ≔ ∅  =>  calPCostNDs.clear();
//   [A9] calPCost ≔ ∅  =>  calPCost.clear();
//   [A9] pktDestAddr ≔ ∅  =>  pktDestAddr.clear();
//   [A9] vPktDestAddr ≔ ∅  =>  vPktDestAddr.clear();
//   [A9] deadNbrs ≔ ∅  =>  deadNbrs.clear();
//   [A9] parent ≔ ∅  =>  parent.clear();
//   [A9] cost ≔ ∅  =>  cost.clear();
//   [A9] chosenNDs ≔ ∅  =>  chosenNDs.clear();
//   [R15] pkt ∉ dom(pktDestAddr)  =>  (dom.count(pktDestAddr) == 0 || dom.at(pktDestAddr).count(pkt) == 0)
//   [A7] y =  cRouteTree(x)  =>  int y = cRouteTree.at(x);
//   [A8] pkt ∈ dom(pktDestAddr)  =>  pktDestAddr.count(pkt) > 0
//   [A7] dest=pktDestAddr(pkt)  =>  int dest = pktDestAddr.at(pkt);
//   [R15] pkt ∉ dom(vPktDestAddr)  =>  (dom.count(vPktDestAddr) == 0 || dom.at(vPktDestAddr).count(pkt) == 0)
//   [R14] pktDestAddr ≔  {pkt} ⩤ pktDestAddr  =>  pktDestAddr.erase(pkt);
//   [A8] pkt ∈ dom(vPktDestAddr)  =>  vPktDestAddr.count(pkt) > 0
//   [A7] dest = vPktDestAddr(pkt)  =>  int dest = vPktDestAddr.at(pkt);
//   [A8] x ∈ dom(cRouteTree)  =>  cRouteTree.count(x) > 0
//   [A7] par = cRouteTree(x)  =>  int par = cRouteTree.at(x);
//   [A8] x ∈ dom(cpCost)  =>  cpCost.count(x) > 0
//   [A7] cst = cpCost(x)  =>  int cst = cpCost.at(x);
//   [R2] y ↦ x ∈ dom(parent)  =>  parent.find({y, x}) != parent.end()
//   [R2] y ↦ x ∈ dom(cost)  =>  cost.find({y, x}) != cost.end()
//   [R15] x ∉ dom(cRouteTree)  =>  (dom.count(cRouteTree) == 0 || dom.at(cRouteTree).count(x) == 0)
//   [A6] x ∉ chosenNDs  =>  chosenNDs.count(x) == 0
//   [R6] nb = ran({x} ◁  neighbourTbl)  =>  const std::set<int>& nb = neighbourTbl.at(x);
//   [A2] nb  ≠ ∅  =>  !nb.empty()
//   [A2] Nbrs = ∅  =>  Nbrs.empty()
//   [R3] chosenNDs ≔ chosenNDs ∪ {x}  =>  chosenNDs.insert(x);
//   [A6] nb ∈ Nbrs  =>  Nbrs.count(nb) > 0
//   [R2] x ↦nb  ∈ dom(receiveEst)  =>  receiveEst.find({x, nb}) != receiveEst.end()
//   [R18] rEst = receiveEst(x ↦ nb)  =>  int rEst = tupleApply(receiveEst, x, nb);
//   [R2] x ↦nb ∈ dom(sentEst)  =>  sentEst.find({x, nb}) != sentEst.end()
//   [R18] sEst = sentEst(x ↦ nb)  =>  int sEst = tupleApply(sentEst, x, nb);
//   [R6] Nbrs1 = ran({x} ◁ neighbourTbl)  =>  const std::set<int>& Nbrs1 = neighbourTbl.at(x);
//   [A2] Nbrs1 ≠ ∅  =>  !Nbrs1.empty()
//   [R4] Nbrs ≔ Nbrs  ∖ {nb}  =>  Nbrs.erase(nb);
//   [R18] pREst = receiveEst(x ↦ nb)  =>  int pREst = tupleApply(receiveEst, x, nb);
//   [R18] pSEst = sentEst(x ↦ nb)  =>  int pSEst = tupleApply(sentEst, x, nb);
//   [A6] x ∉ nodes  =>  nodes.count(x) == 0
//   [A6] p ∈ nodes  =>  nodes.count(p) > 0
//   [R3] nodes ≔ nodes  ∪  {x}  =>  nodes.insert(x);
//   [A2] calPCostNDs = ∅  =>  calPCostNDs.empty()
//   [A6] x ∉ deadNbrs  =>  deadNbrs.count(x) == 0
//   [A2] chosenNDs ≠ ∅  =>  !chosenNDs.empty()
