import type { EncodedMachine, EncodingForm, GeneratedTree } from "./types";
import { translateEvent } from "./ruleEngine";

// Map an Event-B carrier token to its C++ alias (defined in eb_context.h).
const ALIAS: Record<string, string> = { ND: "Node", PKT: "PktId", Dests: "Node", "ℤ": "Data", BOOL: "bool" };
const alias = (token: string): string => ALIAS[token] ?? "int";

// Pull domain/range carrier tokens out of an invariant, unwrapping ℙ(…).
function domRan(inv: string | undefined): { dom?: string; ran?: string } {
  if (!inv) return {};
  const rhs = inv.replace(/^[^∈⊆]*[∈⊆]\s*/, "").trim();
  const m = /(.+?)\s*(↔|→|⇸)\s*(.+)/.exec(rhs);
  if (m) {
    const dTok = (m[1].match(/\w+|ℤ/g) ?? []).pop()!;          // last word of domain
    const rRaw = m[3].replace(/ℙ\(|\)/g, "").trim();           // unwrap ℙ(…)
    const rTok = (rRaw.match(/\w+|ℤ/g) ?? [])[0]!;
    return { dom: alias(dTok), ran: alias(rTok) };
  }
  const sub = /ℙ\((\w+|ℤ)\)|⊆\s*(\w+)/.exec(inv);              // plain set / ℙ(T)
  if (sub) return { ran: alias(sub[1] ?? sub[2]) };
  return {};
}

function cppType(form: EncodingForm, inv: string | undefined): string {
  const { dom = "int", ran = "int" } = domRan(inv);
  switch (form) {
    case "set": return `std::set<${ran}>`;
    case "function": return `std::map<${dom}, ${ran}>`;
    case "pair-set": return `std::set<std::pair<${dom}, ${ran}>>`;
    case "map-of-sets": return `std::map<${dom}, std::set<${ran}>>`;
    case "bool": return "bool";
    default: return "int";
  }
}

// Parameter list, typed from the event's typing guards (then those guards drop).
function params(ev: { parameters: string[]; guards: string[] }): string {
  const typeOf = (p: string): string => {
    for (const g of ev.guards) {
      // Set-typed param: `p ∈ ℙ(T)` or the set-builder `p ∈ {n∣ … ℙ(T) …}`.
      // Capture T and alias it, so a set over PKT/ℤ isn't mis-typed as Node.
      const setM = new RegExp(`\\b${p}\\s*∈\\s*(?:ℙ\\(|\\{[^}]*ℙ\\()\\s*(\\w+|ℤ)`).exec(g);
      if (setM) return `const std::set<${alias(setM[1])}>&`;
      const m = new RegExp(`\\b${p}\\s*∈\\s*(\\w+|ℤ)`).exec(g);
      if (m) return alias(m[1]);
    }
    return "int";
  };
  return ev.parameters.map((p) => `${typeOf(p)} ${p}`).join(", ");
}

// SensorApp packet-flow structures, merged into the CommPattern pair when the
// model has one. Thesis S4/S5 direction (phdThesis_Adisak, docs/06): send_down
// = transmit down to the channel → SensorApp::sendSensorPacket; send_up =
// channel delivers up to the receiving node → SensorApp's receive path.
const TRANSMIT_BLOCK = [
  "    // — SensorApp transmit structure (SensorApp::sendSensorPacket) —",
  "    if (socket == nullptr || sinkAddress.isUnspecified()) {",
  '        EV_WARN << "socket/sinkAddress not ready, skipping send\\n";',
  "        return false;",
  "    }",
  "    char pktName[32];",
  '    snprintf(pktName, sizeof(pktName), "sensor-%ld", sendSeqNo);',
  "    Packet *packet = new Packet(pktName);",
  "    auto payload = makeShared<ByteCountChunk>(B(payloadLength));",
  "    packet->insertAtBack(payload);",
  "    packet->addTag<PacketProtocolTag>()->setProtocol(&Protocol::manet);",
  "    packet->addTag<L3AddressReq>()->setDestAddress(sinkAddress);",
  "    emit(packetSentSignal, packet);",
  "    socket->send(packet);",
  "    sendSeqNo++;",
  "    sentCount++;",
];
const RECEIVE_BLOCK = [
  "    // — SensorApp receive structure (accounting; the packet object itself",
  "    //   is handled in socketDataArrived, which calls this event) —",
  "    receivedCount++;",
];

export function emit(model: EncodedMachine, name: string): GeneratedTree {
  const fields = [...model.encodings.entries()]
    .map(([id, form]) => `    ${cppType(form, model.variableTypes.get(id))} ${id};`).join("\n");

  const hasSendDown = model.events.some((e) => e.label === "send_down");
  const hasSendUp = model.events.some((e) => e.label === "send_up");

  const decls: string[] = [];
  const defs: string[] = [];
  for (const raw of model.events) {
    if (raw.label === "INITIALISATION") continue;
    const t = translateEvent(raw, model);
    const sig = `bool ${t.label}(${params(raw)})`;
    decls.push(`    ${sig};`);
    // Untranslated clauses stay visible: omitting a guard silently weakens
    // the precondition, omitting an action silently weakens the effect.
    const noteG = t.untranslatedGuards.map((g) => `    // UNTRANSLATED GUARD: ${g}`);
    const noteA = t.untranslatedActions.map((a) => `    // UNTRANSLATED ACTION: ${a}`);
    const inject =
      raw.label === "send_down" ? TRANSMIT_BLOCK
      : raw.label === "send_up" ? RECEIVE_BLOCK
      : [];
    if (inject.length === 0 && t.actions.length === 0 && noteA.length === 0) {
      const pred = t.guards.length ? t.guards.join(" && ") : "true";
      const body = [...noteG, `    return ${pred};`].join("\n");
      defs.push(`bool ${name}::${t.label}(${params(raw)}) {\n${body}\n}`);
    } else {
      const body = [
        ...t.guards.map((g) => `    if (!(${g})) return false;`),
        ...noteG,
        ...inject,
        ...t.actions.map((a) => `    ${a}`),
        ...noteA,
        "    return true;",
      ].join("\n");
      defs.push(`bool ${name}::${t.label}(${params(raw)}) {\n${body}\n}`);
    }
  }

  const init = model.events.find((e) => e.label === "INITIALISATION");
  const tInit = init ? translateEvent(init, model) : undefined;
  const ctorBody = tInit
    ? [
        ...tInit.actions.map((a) => `    ${a}`),
        ...tInit.untranslatedActions.map((a) => `    // UNTRANSLATED ACTION: ${a}`),
      ].join("\n")
    : "";

  // One neutral provenance banner shared by all three emitted files. It names
  // the actual input — the whole merged chain when there is one, a single
  // machine otherwise — so nothing in the comment is tied to any fixed model.
  const provenance = model.chain.length > 1
    ? `the Event-B refinement chain ${model.chain.join(" → ")} (merged into one module)`
    : `the Event-B machine ${model.name}`;
  const banner = `Generated by wsn-codegen from ${provenance}.
Do not edit by hand — regenerate instead.`;
  const cxxBanner = banner.split("\n").map((l) => `// ${l}`).join("\n");

  const header = `${cxxBanner}
#pragma once
#include <map>
#include <set>
#include <utility>
#include "eb_helpers.h"
#include "eb_context.h"
#include "inet/applications/base/ApplicationBase.h"
#include "inet/common/Protocol.h"
#include "inet/common/lifecycle/LifecycleOperation.h"
#include "inet/common/packet/Packet.h"
#include "inet/networklayer/common/L3Address.h"
#include "inet/networklayer/contract/INetworkSocket.h"

using namespace inet;

// Module shell modelled on INET's SensorApp (inet/applications/sensorapp).
// The SensorApp packet-flow structures are realized through the model's own
// CommPattern events when it has them (thesis S4/S5): send_down() carries the
// transmit structure (SensorApp::sendSensorPacket) and send_up() the receive
// accounting; a model without the pair gets SensorApp's own sendSensorPacket()
// instead. Binding the model identities (which node/packet a simulation
// message is) happens at the marked extension points in handleMessageWhenUp()
// and socketDataArrived().
class ${name} : public ApplicationBase, public INetworkSocket::ICallback {
  protected:
    // ── Event-B machine state ──
${fields}

    // ── SensorApp shell: parameters (read in initialize / openSocket) ──
    L3Address sinkAddress;
    cPar *sensingIntervalPar = nullptr;
    int payloadLength = 0;
    simtime_t startTime;
    simtime_t stopTime;

    // ── SensorApp shell: state ──
    INetworkSocket *socket = nullptr;
    cMessage *timer = nullptr;
    long sendSeqNo = 0;
    long sentCount = 0;
    long receivedCount = 0;

    // ── statistics ──
    static simsignal_t packetSentSignal;
    static simsignal_t packetReceivedSignal;

  protected:
    void initialize(int stage) override;
    int numInitStages() const override { return NUM_INIT_STAGES; }
    void handleMessageWhenUp(cMessage *msg) override;
    void finish() override;
    void refreshDisplay() const override;

    // SensorApp shell helpers${hasSendDown ? " (the transmit structure lives in send_down below)" : ""}
    virtual void openSocket();
${hasSendDown ? "" : "    virtual void sendSensorPacket();\n"}    virtual void scheduleNextSensing(simtime_t previous);
    virtual void cancelNextSensing();
    virtual bool isEnabled();

    // ApplicationBase lifecycle
    void handleStartOperation(LifecycleOperation *operation) override;
    void handleStopOperation(LifecycleOperation *operation) override;
    void handleCrashOperation(LifecycleOperation *operation) override;

    // INetworkSocket::ICallback
    void socketDataArrived(INetworkSocket *socket, Packet *packet) override;
    void socketClosed(INetworkSocket *socket) override;

    // Event-B events, one guarded bool method each: the guards are checked
    // first (early return), then the actions run.
${decls.join("\n")}

  public:
    ${name}();
    virtual ~${name}();
};
`;

  const source = `${cxxBanner}
#include "${name}.h"

#include "inet/common/ModuleAccess.h"
#include "inet/common/Protocol.h"
#include "inet/common/ProtocolTag_m.h"
#include "inet/common/lifecycle/ModuleOperations.h"
#include "inet/common/packet/chunk/ByteCountChunk.h"
#include "inet/networklayer/common/L3AddressResolver.h"
#include "inet/networklayer/common/L3AddressTag_m.h"
#include "inet/networklayer/contract/L3Socket.h"

Define_Module(${name});

simsignal_t ${name}::packetSentSignal = registerSignal("packetSent");
simsignal_t ${name}::packetReceivedSignal = registerSignal("packetReceived");

// Event-B INITIALISATION.
${name}::${name}() {
${ctorBody}
}

${name}::~${name}() {
    cancelAndDelete(timer);
    delete socket;
}

void ${name}::initialize(int stage) {
    ApplicationBase::initialize(stage);
    if (stage == INITSTAGE_LOCAL) {
        sensingIntervalPar = &par("sensingInterval");
        payloadLength = par("payloadLength");
        startTime = par("startTime");
        stopTime = par("stopTime");
        if (stopTime >= SIMTIME_ZERO && stopTime < startTime)
            throw cRuntimeError("Invalid startTime/stopTime parameters");
        timer = new cMessage("sensingTimer");
    }
}

bool ${name}::isEnabled() {
    // the module emits packets only when a destination is configured
    return par("sinkAddress").stringValue()[0] != '\\0';
}

void ${name}::openSocket() {
    // Resolve the sink lazily (it may stay empty on a passive sink-side node).
    const char *sinkStr = par("sinkAddress");
    if (sinkStr[0])
        sinkAddress = L3AddressResolver().resolve(sinkStr);

    // Bind an L3 socket over the configured network protocol; without one
    // the module stays passive (no socket), as in SensorApp's passive mode.
    const char *netProtoStr = par("networkProtocol");
    if (!*netProtoStr) {
        EV_INFO << "no networkProtocol parameter; not opening socket\\n";
        return;
    }
    socket = new L3Socket(Protocol::getProtocol(netProtoStr), gate("socketOut"));
    socket->bind(&Protocol::manet, L3Address());
    socket->setCallback(this);
}

${hasSendDown ? "" : `// Send-down flow: build one packet and hand it down to the network layer
// through the socket (same as SensorApp).
void ${name}::sendSensorPacket() {
    if (sinkAddress.isUnspecified() || socket == nullptr) {
        EV_WARN << "sinkAddress unspecified, skipping send\\n";
        return;
    }

    // EXTENSION POINT (send-down flow): guard/trigger the transmission with
    // the generated Event-B event methods declared above.

    char pktName[32];
    snprintf(pktName, sizeof(pktName), "sensor-%ld", sendSeqNo);
    Packet *packet = new Packet(pktName);
    auto payload = makeShared<ByteCountChunk>(B(payloadLength));
    packet->insertAtBack(payload);
    packet->addTag<PacketProtocolTag>()->setProtocol(&Protocol::manet);
    packet->addTag<L3AddressReq>()->setDestAddress(sinkAddress);

    emit(packetSentSignal, packet);
    socket->send(packet);
    sendSeqNo++;
    sentCount++;
}

`}void ${name}::scheduleNextSensing(simtime_t previous) {
    simtime_t next;
    if (previous < SIMTIME_ZERO)
        next = simTime() <= startTime ? startTime : simTime();
    else
        next = previous + *sensingIntervalPar;
    if (stopTime < SIMTIME_ZERO || next < stopTime)
        scheduleAt(next, timer);
}

void ${name}::cancelNextSensing() {
    cancelEvent(timer);
}

void ${name}::handleMessageWhenUp(cMessage *msg) {
    if (msg->isSelfMessage()) {
        ASSERT(msg == timer);
${hasSendDown
    ? `        // EXTENSION POINT (send-down flow): bind the model identities and
        // drive the transmit chain — e.g. start_tx(...), then send_down(x, pkt);
        // send_down() itself carries the SensorApp transmit structure.`
    : "        sendSensorPacket();"}
        scheduleNextSensing(simTime());
    }
    else if (socket && socket->belongsToSocket(msg)) {
        socket->processMessage(msg);   // delivered to socketDataArrived
    }
    else {
        EV_WARN << "dropping unaccepted message " << msg->getName() << "\\n";
        delete msg;
    }
}

// Send-up flow: a packet the network layer sent up arrives here via
// handleMessageWhenUp → socket (same as SensorApp).
void ${name}::socketDataArrived(INetworkSocket *, Packet *packet) {
${hasSendUp
    ? `    // EXTENSION POINT (send-up flow): bind the model identities and let the
    // model consume the delivery — e.g. send_up(x, pkt, nbrs); send_up()
    // itself carries the SensorApp receive accounting.`
    : `    // EXTENSION POINT (send-up flow): dispatch to the generated Event-B
    // receive-side event methods declared above.
    receivedCount++;`}

    EV_INFO << "received " << packet->getByteLength() << "B\\n";
    emit(packetReceivedSignal, packet);
    delete packet;
}

void ${name}::socketClosed(INetworkSocket *) {}

void ${name}::handleStartOperation(LifecycleOperation *) {
    openSocket();
    if (isEnabled() && !sinkAddress.isUnspecified())
        scheduleNextSensing(-1);
}

void ${name}::handleStopOperation(LifecycleOperation *) {
    cancelNextSensing();
    if (socket && socket->isOpen())
        socket->close();
    delayActiveOperationFinish(par("stopOperationTimeout"));
}

void ${name}::handleCrashOperation(LifecycleOperation *operation) {
    cancelNextSensing();
    if (socket && operation->getRootModule() != getContainingNode(this))
        socket->destroy();
}

void ${name}::refreshDisplay() const {
    ApplicationBase::refreshDisplay();
    char buf[48];
    snprintf(buf, sizeof(buf), "sent: %ld\\nrcvd: %ld", sentCount, receivedCount);
    getDisplayString().setTagArg("t", 0, buf);
}

void ${name}::finish() {
    recordScalar("packets sent", sentCount);
    recordScalar("packets received", receivedCount);
}

${defs.join("\n\n")}
`;

  // The module is declared standalone and bound to the C++ class via @class;
  // parameters, signals, and gates mirror INET's SensorApp
  // (inet/applications/sensorapp/SensorApp.ned).
  const ned = `import inet.applications.contract.IApp;

//
// ${name} — ${banner.split("\n").join("\n// ")}
// Shell modelled on INET's SensorApp: periodic sensing traffic toward
// sinkAddress over the bound networkProtocol. The C++ class binds via
// @class below.
//
simple ${name} like IApp
{
    parameters:
        @class(${name});
        string sinkAddress = default("");         // destination; empty = passive (sink-side) node
        volatile double sensingInterval @unit(s) = default(1s);
        int payloadLength @unit(B) = default(10B);
        double startTime @unit(s) = default(uniform(0s, this.sensingInterval));
        double stopTime @unit(s) = default(-1s);  // negative: run forever
        string networkProtocol = default("");     // L3 protocol to bind; empty = no socket
        double stopOperationExtraTime @unit(s) = default(-1s);
        double stopOperationTimeout @unit(s) = default(2s);
        @display("i=block/app");
        @lifecycleSupport;
        @signal[packetSent](type=inet::Packet);
        @signal[packetReceived](type=inet::Packet);
        @statistic[packetSent](title="packets sent"; source=packetSent; record=count,"sum(packetBytes)","vector(packetBytes)"; interpolationmode=none);
        @statistic[packetReceived](title="packets received"; source=packetReceived; record=count,"sum(packetBytes)","vector(packetBytes)"; interpolationmode=none);
    gates:
        input socketIn @labels(ITransportPacket/up);
        output socketOut @labels(ITransportPacket/down);
}
`;

  return [
    { path: `${name}.h`, content: header },
    { path: `${name}.cc`, content: source },
    { path: `${name}.ned`, content: ned },
  ];
}
