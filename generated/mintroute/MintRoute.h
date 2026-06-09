#pragma once
#include <map>
#include <set>
#include <utility>
#include "eb_helpers.h"
#include "inet/networklayer/base/NetworkProtocolBase.h"

using namespace inet;

class MintRoute : public NetworkProtocolBase {
 protected:
  std::map<int, int> xmittedPkts;
  std::map<int, int> middleware;
  std::map<int, int> sinkBuff;
  std::map<int, int> lostPkts;
  std::set<std::pair<int,int>> ndBuff;
  std::set<std::pair<int,int>> WiMedium;
  std::map<int, int> sensingNDs;
  std::map<int, int> sensedPkts;
  std::map<int, int> floodedPkts;
  std::map<int, std::set<int>> floodTbl;
  std::map<int, std::set<int>> ctlNeighbours;
  std::map<int, int> floodFlg;
  std::set<std::pair<int,int>> recLostPkts;
  std::map<int, int> senseBuff;
  std::set<std::pair<int,int>> sentUp;
  std::set<std::pair<int,int>> sentDown;
  std::map<int, int> ctlSensedFlg;
  std::map<int, int> dataSeqNo;
  std::map<int, int> floodSeqNo;
  std::map<int, int> nbHops;
  std::map<int, int> pktSeqNo;
  std::map<int, int> pktSrc;
  std::map<int, int> pktFwdr;
  std::map<int, int> pktData;
  std::map<int, int> pktNbHops;
  std::map<int, std::set<int>> wsnLinks;
  std::set<std::pair<int,int>> channel;
  std::map<int, std::set<int>> envNeighbours;
  std::map<int, int> envSensedFlg;
  std::map<int, int> envData;
  std::map<int, int> vPktNbHops;
  std::map<int, int> vPktSrc;
  std::map<int, int> vPktSeqNo;
  std::map<int, int> vPktFwdr;
  std::map<int, int> vPktData;
  std::map<int, int> crashedLinks;
  std::map<int, int> totalSentBcon;
  std::map<int, int> netSeqNo;
  std::set<std::pair<int,int>> updateNbrs;
  std::map<int, std::set<int>> neighbourTbl;
  std::map<std::pair<int,int>, int> missed;
  std::map<std::pair<int,int>, int> received;
  std::map<std::pair<int,int>, int> lastSeqno;
  std::map<std::pair<int,int>, int> receiveEst;
  std::map<int, int> linkSeqNo;
  std::map<int, int> estNDs;
  std::map<int, int> estNbrs;
  std::map<std::pair<int,int>, int> sentEst;
  std::map<int, int> bcastRouTimer;
  std::map<int, int> bcastRouNodes;
  std::map<int, int> routeSeqNo;
  std::map<std::pair<int,int>, int> liveliness;
  std::map<int, int> checkedLiveNbrs;
  std::map<int, int> chooseParentTimer;
  std::map<int, int> nodes;
  std::map<int, int> cRouteTree;
  std::map<int, int> Nbrs;
  std::map<int, int> completedRoute;
  std::map<int, int> cpCost;
  std::set<std::pair<int,int>> calPCostNDs;
  std::map<std::pair<int,int>, int> calPCost;
  std::map<int, int> vPktDestAddr;
  std::map<int, int> calPCostFlg;
  std::map<int, int> pktDestAddr;
  std::map<std::pair<int,int>, int> parent;
  std::map<std::pair<int,int>, int> cost;
  std::map<int, int> deadNbrs;
  std::map<int, int> chosenNDs;

  void handleUpperPacket(Packet *packet) override;
  void handleLowerPacket(Packet *packet) override;
  void initialize(int stage) override;
};
