import type { EncodingForm, RuleId } from "./types";

// Translation rule catalog (R1–R20 + A1–A5), transcribed from the frozen
// citation-ready reference `design/translation_rules_examples.md` v3.1
// Tables 3-1 (abstract) / 3-2 (worked examples). Emission helper names match
// `src/assets/eb_helpers.h` (the canonical CommPattern names + eb_* helpers).
//
// Each rule recognizes one Event-B surface form (Unicode predicate/assignment
// string from a guard or action) and emits the corresponding C++ snippet.
// RULES is ordered MOST-SPECIFIC-FIRST (Tier 3 nested → Tier 2 → Tier 1 → aux)
// so nested forms (R19, R17) win over broader ones; the rule engine takes the
// first matching rule per expression.

export interface RuleMatch { captures: Record<string, string>; }
export interface Rule {
  id: RuleId;
  tier: 1 | 2 | 3 | "aux";
  form?: "A" | "B" | "C";
  provenance: "raw-XML" | "PDF-only";
  match: (expr: string) => RuleMatch | null;
  emit: (m: RuleMatch, enc: (id: string) => EncodingForm | undefined) => string;
}

const re = (p: RegExp) => (expr: string): RuleMatch | null => {
  const g = p.exec(expr);
  return g ? { captures: g.groups ?? {} } : null;
};

export const RULES: Rule[] = [
  // ── Tier 3 — RouteTable SourceRouteCache (DSR-only, PDF-only) ───────────
  { id: "R19", tier: 3, form: "C", provenance: "PDF-only",
    match: re(/(?<pNd>\w+)\s*=\s*ran\(\{(?<i>\w+)\}\s*◁\s*ran\(\{(?<p>\w+)\}\s*◁\s*(?<path>\w+)\)\)/),
    emit: (m) => `int ${m.captures.pNd} = routeNodeAt(${m.captures.path}, ${m.captures.p}, ${m.captures.i});` },
  { id: "R20", tier: 3, form: "C", provenance: "PDF-only",
    match: re(/card\(ran\(\{(?<p>\w+)\}\s*◁\s*(?<path>\w+)\)\)/),
    emit: (m) => `routeLength(${m.captures.path}, ${m.captures.p})` },

  // ── Tier 2 — RouteTable PairRouteTable (RTMCS + DSR) ────────────────────
  { id: "R17", tier: 2, form: "A", provenance: "raw-XML",
    match: re(/(?<s>\w+)\s*∈\s*ran\(\{(?<x>\w+)\}\s*◁\s*dom\((?<R>\w+)\)\)/),
    emit: (m) => `domRestrictedRange(${m.captures.R}, ${m.captures.x}).count(${m.captures.s}) > 0` },
  { id: "R18", tier: 2, form: "B", provenance: "raw-XML",
    match: re(/(?<nxt>\w+)\s*=\s*(?<R>\w+)\((?<x>\w+)\s*↦\s*(?<s>\w+)\)/),
    emit: (m) => `int ${m.captures.nxt} = tupleApply(${m.captures.R}, ${m.captures.x}, ${m.captures.s});` },

  // ── Tier 1 — cross-protocol common (R1–R16), most-specific first ────────
  // R13 nested map insert: R := R ∪ {k ↦ {a ↦ b}}
  { id: "R13", tier: 1, provenance: "raw-XML",
    match: re(/(?<R>\w+)\s*≔\s*\k<R>\s*∪\s*\{(?<k>\w+)\s*↦\s*\{(?<a>\w+)\s*↦\s*(?<b>\w+)\}\}/),
    emit: (m) => `${m.captures.R}[${m.captures.k}][${m.captures.a}] = ${m.captures.b};` },
  // R16 set-valued function update: f(k) := f(k) ∪ {x}
  { id: "R16", tier: 1, provenance: "raw-XML",
    match: re(/(?<f>\w+)\((?<k>\w+)\)\s*≔\s*\k<f>\(\k<k>\)\s*∪\s*\{(?<x>\w+)\}/),
    emit: (m) => `${m.captures.f}[${m.captures.k}].insert(${m.captures.x});` },
  // R15 set-valued function membership: x ∉ f(k)
  { id: "R15", tier: 1, provenance: "raw-XML",
    match: re(/(?<x>\w+)\s*∉\s*(?<f>\w+)\((?<k>\w+)\)/),
    emit: (m) => `(${m.captures.f}.count(${m.captures.k}) == 0 || ${m.captures.f}.at(${m.captures.k}).count(${m.captures.x}) == 0)` },
  // R11 non-empty restriction guard: {k} ◁ R ≠ ∅  /  {k} ◁ R = ∅
  { id: "R11", tier: 1, provenance: "raw-XML",
    match: re(/\{(?<k>\w+)\}\s*◁\s*(?<R>\w+)\s*(?<op>≠|=)\s*∅/),
    emit: (m) => m.captures.op === "≠"
      ? `(${m.captures.R}.count(${m.captures.k}) > 0 && !${m.captures.R}.at(${m.captures.k}).empty())`
      : `(${m.captures.R}.count(${m.captures.k}) == 0 || ${m.captures.R}.at(${m.captures.k}).empty())` },
  // R9 relational override: R ⊴ {k ↦ v}
  { id: "R9", tier: 1, provenance: "raw-XML",
    match: re(/(?<R>\w+)\s*⊴\s*\{(?<k>\w+)\s*↦\s*(?<v>\w+)\}/),
    emit: (m) => `${m.captures.R}[${m.captures.k}] = ${m.captures.v};` },
  // R8 range anti-restriction: R := R ▷ {x}
  { id: "R8", tier: 1, provenance: "raw-XML",
    match: re(/(?<R>\w+)\s*≔\s*\k<R>\s*▷\s*\{(?<x>\w+)\}/),
    emit: (m) => `eb_range_anti_restrict_pairset(${m.captures.R}, std::set<int>{${m.captures.x}});` },
  // R7 relational image (assignment form): nbs = R[{f}]
  { id: "R7", tier: 1, provenance: "raw-XML",
    match: re(/(?<nbs>\w+)\s*=\s*(?<R>\w+)\[\{(?<f>\w+)\}\]/),
    emit: (m) => `const std::set<int>& ${m.captures.nbs} = ${m.captures.R}.at(${m.captures.f});` },
  // R6 range of domain restriction (map-of-sets read): nbrs = ran({k} ◁ R)
  { id: "R6", tier: 1, provenance: "raw-XML",
    match: re(/(?<nbrs>\w+)\s*=\s*ran\(\{(?<k>\w+)\}\s*◁\s*(?<R>\w+)\)/),
    emit: (m) => `const std::set<int>& ${m.captures.nbrs} = ${m.captures.R}.at(${m.captures.k});` },
  // R5 domain restriction (assignment): T := D ◁ R
  { id: "R5", tier: 1, provenance: "raw-XML",
    match: re(/(?<T>\w+)\s*≔\s*(?<D>\w+)\s*◁\s*(?<R>\w+)/),
    emit: (m) => `${m.captures.T} = eb_dom_restrict(${m.captures.D}, ${m.captures.R});` },
  // R2 domain membership: x ↦ s ∈ dom(R)
  { id: "R2", tier: 1, provenance: "raw-XML",
    match: re(/(?<x>\w+)\s*↦\s*(?<s>\w+)\s*∈\s*dom\((?<R>\w+)\)/),
    emit: (m) => `${m.captures.R}.find({${m.captures.x}, ${m.captures.s}}) != ${m.captures.R}.end()` },
  // R12 domain over union: x ∈ dom(R ∪ S)  /  x ∉ dom(R ∪ S)
  { id: "R12", tier: 1, provenance: "raw-XML",
    match: re(/(?<x>\w+)\s*(?<op>∉|∈)\s*dom\((?<R>\w+)\s*∪\s*(?<S>\w+)\)/),
    emit: (m) => `${m.captures.op === "∉" ? "!" : ""}eb_in_dom_union_pairset(${m.captures.R}, ${m.captures.S}, ${m.captures.x})` },
  // R10 range over union: x ∈ ran(R ∪ S)   (not followed by ∖ — that is A5)
  { id: "R10", tier: 1, provenance: "raw-XML",
    match: re(/(?<pkt>\w+)\s*∈\s*ran\((?<R>\w+)\s*∪\s*(?<S>\w+)\)(?!\s*∖)/),
    emit: (m) => `eb_in_range_union(${m.captures.R}, ${m.captures.S}, ${m.captures.pkt})` },
  // R14 domain anti-restriction (function remove): R := {k} ⩤ R
  { id: "R14", tier: 1, provenance: "raw-XML",
    match: re(/(?<R>\w+)\s*≔\s*\{(?<k>\w+)\}\s*⩤\s*\k<R>/),
    emit: (m) => `${m.captures.R}.erase(${m.captures.k});` },
  // R4 set remove: S := S ∖ {x}
  { id: "R4", tier: 1, provenance: "raw-XML",
    match: re(/(?<S>\w+)\s*≔\s*\k<S>\s*∖\s*\{(?<x>\w+)\}/),
    emit: (m) => `${m.captures.S}.erase(${m.captures.x});` },
  // R3 set insert: S := S ∪ {x}
  { id: "R3", tier: 1, provenance: "raw-XML",
    match: re(/(?<S>\w+)\s*≔\s*\k<S>\s*∪\s*\{(?<x>\w+)\}/),
    emit: (m) => `${m.captures.S}.insert(${m.captures.x});` },
  // R1 set membership (type guard): type(x) ∈ S
  { id: "R1", tier: 1, provenance: "raw-XML",
    match: re(/type\((?<x>\w+)\)\s*∈\s*(?<S>\w+)/),
    emit: (m) => `${m.captures.S}.count(getType(${m.captures.x})) > 0` },

  // ── Auxiliary (A1–A5) — completeness, not part of the contribution count ─
  // A5 two-set difference: pkt ∈ ran(R ∪ S) ∖ f(d)
  { id: "A5", tier: "aux", provenance: "raw-XML",
    match: re(/(?<pkt>\w+)\s*∈\s*ran\((?<R>\w+)\s*∪\s*(?<S>\w+)\)\s*∖\s*(?<f>\w+)\((?<d>\w+)\)/),
    emit: (m) => `eb_in_range_union(${m.captures.R}, ${m.captures.S}, ${m.captures.pkt}) && ${m.captures.f}.at(${m.captures.d}).count(${m.captures.pkt}) == 0` },
  // A4 two-set union: S := S ∪ T  (T a set, not a singleton — those are R3)
  { id: "A4", tier: "aux", provenance: "raw-XML",
    match: re(/(?<S>\w+)\s*≔\s*\k<S>\s*∪\s*(?<T>\w+)\s*$/),
    emit: (m) => `${m.captures.S}.insert(${m.captures.T}.begin(), ${m.captures.T}.end());` },
  // A3 range membership: x ∈ ran(R)
  { id: "A3", tier: "aux", provenance: "raw-XML",
    match: re(/(?<x>\w+)\s*∈\s*ran\((?<R>\w+)\)/),
    emit: (m) => `eb_in_range(${m.captures.R}, ${m.captures.x})` },
  // A2 emptiness: S = ∅  /  S ≠ ∅
  { id: "A2", tier: "aux", provenance: "raw-XML",
    match: re(/^(?<S>\w+)\s*(?<op>=|≠)\s*∅$/),
    emit: (m) => `${m.captures.op === "≠" ? "!" : ""}${m.captures.S}.empty()` },
  // A1 cardinality: card(S)
  { id: "A1", tier: "aux", provenance: "raw-XML",
    match: re(/^card\((?<S>\w+)\)$/),
    emit: (m) => `${m.captures.S}.size()` },
];
