import type {
  RawModel, ResolvedModel, Protocol, RawMachine,
} from "./types";

export function resolveModel(raw: RawModel): ResolvedModel {
  const ordered = orderByRefines(raw.machines);
  return {
    protocol: detectProtocol(raw),
    machines: ordered.map((m) => ({ name: m.name, variables: m.variables, events: m.events })),
    ...collectContext(raw),
    variableTypes: indexVariableTypes(ordered),
  };
}

function orderByRefines(machines: RawMachine[]): RawMachine[] {
  const byName = new Map(machines.map((m) => [m.name, m]));
  let cur = machines.find((m) => !m.refines || !byName.has(m.refines));
  const ordered: RawMachine[] = [];
  while (cur) {
    ordered.push(cur);
    const next: RawMachine | undefined = machines.find((m) => m.refines === cur!.name);
    cur = next;
  }
  for (const m of machines) if (!ordered.includes(m)) ordered.push(m); // defensive
  return ordered;
}

function indexVariableTypes(machines: RawMachine[]): Map<string, string> {
  const types = new Map<string, string>();
  for (const m of machines) {
    for (const inv of m.invariants ?? []) {
      const match = inv.text.match(/^\s*([A-Za-z_]\w*)\s*(∈|⊆)/);
      if (match && !types.has(match[1])) types.set(match[1], inv.text);
    }
  }
  return types;
}

function collectContext(raw: RawModel): { sets: string[]; constants: string[] } {
  const sets = new Set<string>();
  const constants = new Set<string>();
  for (const c of raw.contexts) {
    c.sets.forEach((s) => sets.add(s));
    c.constants.forEach((k) => constants.add(k));
  }
  return { sets: [...sets], constants: [...constants] };
}

function detectProtocol(raw: RawModel): Protocol {
  const ids = new Set(raw.machines.flatMap((m) => m.variables));
  if (ids.has("fwdRouteTbl") || ids.has("bwdRouteTbl")) return "RTMCS";
  if (ids.has("neighbourTbl") || ids.has("gpCurrentParent")) return "MintRoute";
  return "DSR"; // dsrPath, or the WBAN_1_0 stub
}
