import type {
  ResolvedModel, DetectedPatterns, EncodedModel, EncodingForm,
} from "./types";

// Authoritative seed table (spec §5 example-variable lists). Wins over inference
// for the three case studies.
const SEED: Record<string, EncodingForm> = {
  fwdNextND: "pair-keyed", bwdNextND: "pair-keyed", dsrPath: "pair-keyed",
  ctlNeighbours: "map-of-sets", envNeighbours: "map-of-sets",
  wsnLinks: "map-of-sets", floodTbl: "map-of-sets", destBuff: "map-of-sets",
  bwdRouteTbl: "pair-set", fwdRouteTbl: "pair-set", sentUp: "pair-set", sentDown: "pair-set",
};

export function resolveEncodings(model: ResolvedModel, patterns: DetectedPatterns): EncodedModel {
  const encodings = new Map<string, EncodingForm>();
  for (const [id, invariant] of model.variableTypes) {
    encodings.set(id, SEED[id] ?? infer(id, invariant, model));
  }
  return { ...model, encodings, patterns };
}

function infer(id: string, invariant: string, model: ResolvedModel): EncodingForm {
  const rhs = invariant.replace(/^[^∈]*∈\s*/, "");          // type after ∈
  if (/→|⇸/.test(rhs)) {
    return isProductDomainFunction(rhs, model) ? "pair-keyed" : "function";
  }
  if (/↔/.test(rhs)) {
    if (/↔\s*ℙ\(/.test(rhs)) return "map-of-sets";          // A ↔ ℙ(B)
    return usesKeySetAccess(id, model) ? "map-of-sets" : "pair-set";
  }
  return "function"; // subsets/flags default
}

function isProductDomainFunction(rhs: string, model: ResolvedModel): boolean {
  const dom = rhs.split(/→|⇸/)[0].trim();
  if (/×/.test(dom)) return true;
  const domType = model.variableTypes.get(dom);
  return !!domType && /↔/.test(domType);
}

function usesKeySetAccess(id: string, model: ResolvedModel): boolean {
  const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`◁\\s*${esc}\\b`), // {k} ◁ id
    new RegExp(`\\b${esc}\\s*\\(`), // id(k)
  ];
  for (const m of model.machines) {
    for (const ev of m.events) {
      const texts = [...ev.guards, ...ev.actions].map((x) => x.text);
      if (texts.some((t) => patterns.some((p) => p.test(t)))) return true;
    }
  }
  return false;
}
