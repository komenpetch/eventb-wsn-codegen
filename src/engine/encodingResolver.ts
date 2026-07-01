import type { FlatMachine, EncodedMachine, EncodingForm } from "./types";

export function resolveEncodings(machine: FlatMachine): EncodedMachine {
  const encodings = new Map<string, EncodingForm>();
  for (const [id, inv] of machine.variableTypes)
    encodings.set(id, infer(id, inv, machine));
  return { ...machine, encodings };
}

function infer(id: string, invariant: string, machine: FlatMachine): EncodingForm {
  const rhs = invariant.replace(/^[^∈⊆]*[∈⊆]\s*/, "").trim();   // type after ∈ / ⊆

  // ENC3 function (total/partial). A → ℙ(B) is map-of-sets (ENC5), not function.
  if (/→|⇸/.test(rhs)) {
    if (/(→|⇸)\s*ℙ\(/.test(rhs)) return "map-of-sets";          // ENC5: → ℙ(B)
    return "function";                                          // ENC3 (incl. → BOOL)
  }
  // Relation A ↔ B: ENC5 if accessed per key, else ENC4 pair-set.
  if (/↔/.test(rhs)) {
    if (/↔\s*ℙ\(/.test(rhs)) return "map-of-sets";
    return usesKeyAccess(id, machine) ? "map-of-sets" : "pair-set";
  }
  // ⊆ T / ℙ(T) with no arrow → ENC2 plain set.
  if (/^ℙ\(/.test(rhs) || /⊆/.test(invariant)) return "set";
  return "set";   // safe default for an un-typed subset variable
}

// ENC4 vs ENC5: a relation is map-of-sets when the machine reads/writes it by a
// single key — {k}◁id, id(k), or id ≔ id ∪ ({k}×s) — not only by whole pairs.
function usesKeyAccess(id: string, machine: FlatMachine): boolean {
  const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keyForms = [
    new RegExp(`◁\\s*${esc}\\b`),                       // {k} ◁ id
    new RegExp(`\\b${esc}\\s*\\(`),                     // id(k)
    new RegExp(`\\b${esc}\\s*≔\\s*${esc}\\s*∪\\s*\\(\\{`),  // id ≔ id ∪ ({k}×s)
  ];
  for (const ev of machine.events)
    for (const t of [...ev.guards, ...ev.actions])
      if (keyForms.some((p) => p.test(t))) return true;
  return false;
}
