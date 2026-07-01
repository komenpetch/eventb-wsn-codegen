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
      // Set-typed param: `p ∈ ℙ(ND)` or the set-builder `p ∈ {n∣ … ℙ(ND) …}`.
      if (new RegExp(`\\b${p}\\s*∈\\s*(?:ℙ\\(|\\{[^}]*ℙ\\()`).test(g)) return "const std::set<Node>&";
      const m = new RegExp(`\\b${p}\\s*∈\\s*(\\w+|ℤ)`).exec(g);
      if (m) return alias(m[1]);
    }
    return "int";
  };
  return ev.parameters.map((p) => `${typeOf(p)} ${p}`).join(", ");
}

export function emit(model: EncodedMachine, name: string): GeneratedTree {
  const fields = [...model.encodings.entries()]
    .map(([id, form]) => `    ${cppType(form, model.variableTypes.get(id))} ${id};`).join("\n");

  const decls: string[] = [];
  const defs: string[] = [];
  for (const raw of model.events) {
    if (raw.label === "INITIALISATION") continue;
    const t = translateEvent(raw, model);
    const sig = `bool ${t.label}(${params(raw)})`;
    decls.push(`    ${sig};`);
    if (t.actions.length === 0) {
      const pred = t.guards.length ? t.guards.join(" && ") : "true";
      defs.push(`bool ${name}::${t.label}(${params(raw)}) {\n    return ${pred};\n}`);
    } else {
      const body = [
        ...t.guards.map((g) => `    if (!(${g})) return false;`),
        ...t.actions.map((a) => `    ${a}`),
        "    return true;",
      ].join("\n");
      defs.push(`bool ${name}::${t.label}(${params(raw)}) {\n${body}\n}`);
    }
  }

  const init = model.events.find((e) => e.label === "INITIALISATION");
  const ctorBody = init
    ? translateEvent(init, model).actions.map((a) => `    ${a}`).join("\n")
    : "";

  const header = `#pragma once
#include <map>
#include <set>
#include <utility>
#include "eb_helpers.h"
#include "eb_context.h"
#include "inet/routing/base/RoutingProtocolBase.h"

using namespace inet;

class ${name} : public RoutingProtocolBase {
  protected:
${fields}

    // OperationalBase pure virtuals — empty stubs keep the module concrete
    // (real message handling is the network-layer next step).
    void handleMessageWhenUp(cMessage *msg) override { delete msg; }
    void handleStartOperation(LifecycleOperation *op) override {}
    void handleStopOperation(LifecycleOperation *op) override {}
    void handleCrashOperation(LifecycleOperation *op) override {}

    // Application-layer events (translated from the Event-B pattern machine).
${decls.join("\n")}

  public:
    ${name}();
};
`;

  const source = `#include "${name}.h"

Define_Module(${name});

${name}::${name}() {
${ctorBody}
}

${defs.join("\n\n")}
`;

  const ned = `import inet.routing.base.RoutingProtocolBase;

//
// Generated application-layer module from the WSN pattern machine ${model.name}.
// Network-layer wiring (handleUpper/LowerPacket bodies) is the next step.
//
simple ${name} extends RoutingProtocolBase
{
    parameters:
        @class(${name});
        @display("i=block/app");
}
`;

  return [
    { path: `${name}.h`, content: header },
    { path: `${name}.cc`, content: source },
    { path: `${name}.ned`, content: ned },
  ];
}
