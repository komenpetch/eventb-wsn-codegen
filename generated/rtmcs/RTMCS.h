#pragma once
#include <map>
#include <set>
#include <utility>
#include "eb_helpers.h"
#include "inet/networklayer/base/NetworkProtocolBase.h"

using namespace inet;

class RTMCS : public NetworkProtocolBase {
 protected:
  std::map<int, int> xmittedPkts;
  std::map<int, int> middleware;
  std::map<int, std::set<int>> destBuff;
  std::map<int, int> finalDestAddr;
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
  std::map<int, int> envSensedFlg;
  std::map<int, int> envData;
  std::map<int, int> ctlSensedFlg;
  std::map<int, int> senseBuff;
  std::map<int, int> recvedData;
  std::map<int, int> emergencyAlert;
  std::map<int, int> pktData;
  std::map<int, int> vPktData;
  std::set<std::pair<int,int>> sentUp;
  std::set<std::pair<int,int>> sentDown;
  std::set<std::pair<int,int>> channel;
  std::map<int, std::set<int>> envNeighbours;
  std::map<int, std::set<int>> wsnLinks;
  std::map<int, int> crashedLinks;
  std::map<int, int> dataSeqNo;
  std::map<int, int> floodSeqNo;
  std::map<int, int> nbHops;
  std::map<int, int> pktSeqNo;
  std::map<int, int> pktSrc;
  std::map<int, int> pktFwdr;
  std::map<int, int> vPktNbHops;
  std::map<int, int> vPktSrc;
  std::map<int, int> pktNbHops;
  std::map<int, int> vPktSeqNo;
  std::map<int, int> vPktFwdr;
  std::set<std::pair<int,int>> bwdRouteTbl;
  std::map<std::pair<int,int>, int> bwdNextND;
  std::map<std::pair<int,int>, int> bwdSeqNo;
  std::map<std::pair<int,int>, int> bwdHopCnt;
  std::map<int, int> netSeqNo;
  std::map<int, int> linkSeqNo;
  std::set<std::pair<int,int>> updateNbrs;
  std::set<std::pair<int,int>> fwdRouteTbl;
  std::map<std::pair<int,int>, int> fwdNextND;
  std::map<std::pair<int,int>, int> fwdSeqNo;
  std::map<std::pair<int,int>, int> fwdHopCnt;
  std::set<std::pair<int,int>> rrepLists;
  std::map<int, int> rrepSeqNo;
  std::map<int, int> netDestAddr;
  std::map<int, int> envDestAddr;
  std::map<int, int> rrepFlg;
  std::set<std::pair<int,int>> rrerLists;
  std::map<int, int> pktErrND;
  std::set<std::pair<int,int>> errND;
  std::map<int, int> rrerFlg;

  void handleUpperPacket(Packet *packet) override;
  void handleLowerPacket(Packet *packet) override;
  void initialize(int stage) override;
};
