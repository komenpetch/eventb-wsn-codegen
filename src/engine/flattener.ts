import type { RawModel, RawMachine, RawEvent, FlatMachine, FlatEvent } from "./types";

// Build the refines chain from `target` down to the base machine, base first.
function chain(model: RawModel, target: string): RawMachine[] {
  const byName = new Map(model.machines.map((m) => [m.name, m]));
  const out: RawMachine[] = [];
  let cur: RawMachine | undefined = byName.get(target);
  if (!cur) throw new Error(`Machine '${target}' not found among parsed files.`);
  while (cur) {
    out.unshift(cur);                       // base ends up at index 0
    cur = cur.refines ? byName.get(cur.refines) : undefined;
  }
  return out;
}

// An event's identity across the chain: its own label, or the label it refines.
function ancestorLabel(ev: RawEvent): string { return ev.refines ?? ev.label; }

export function flatten(model: RawModel, target: string): FlatMachine {
  const machines = chain(model, target);

  // Accumulate each event by ancestor identity, base → target, so a child that
  // `extends`/`refines` inherits everything declared earlier in the chain.
  const acc = new Map<string, FlatEvent>();
  for (const m of machines) {
    for (const ev of m.events) {
      const key = ancestorLabel(ev);
      const prior = acc.get(key);
      const merged: FlatEvent = {
        label: ev.label,                                       // most-refined label wins
        parameters: dedupe([...(prior?.parameters ?? []), ...ev.parameters]),
        guards: dedupe([...(prior?.guards ?? []), ...ev.guards.map((g) => g.text)]),
        actions: dedupe([...(prior?.actions ?? []), ...ev.actions.map((a) => a.text)]),
      };
      // A refined event may be renamed (creatingPkt → creatingDataPacket); re-key
      // under the new label so a further refinement in the next machine finds it.
      acc.delete(key);
      acc.set(ev.label, merged);
    }
  }

  const variables = dedupe(machines.flatMap((m) => m.variables));
  const variableTypes = new Map<string, string>();
  for (const m of machines)
    for (const inv of m.invariants) {
      const id = inv.text.split(/\s*[∈⊆]\s*/)[0].trim();
      if (variables.includes(id)) variableTypes.set(id, inv.text);
    }

  return { name: target, variables, variableTypes, events: [...acc.values()] };
}

function dedupe<T>(xs: T[]): T[] { return [...new Set(xs)]; }
