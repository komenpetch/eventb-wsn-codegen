import type { EncodedModel, EncodingForm, Fragment } from "./types";
import { RULES } from "./rules";

// Split a predicate/assignment on its TOP-LEVEL ∧ (logical-and) only, leaving
// any ∧ nested inside parentheses intact. A single-clause expression comes back
// as a one-element array, so callers treat split and unsplit uniformly.
export function splitConjuncts(expr: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "∧" && depth === 0) {
      parts.push(expr.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(expr.slice(start));
  return parts.map((s) => s.trim()).filter((s) => s.length > 0);
}

// Built-in Event-B types that, like carrier sets, denote a domain.
const BUILTIN_TYPES = new Set(["ℕ", "ℕ1", "ℤ", "BOOL", "𝔹"]);

// A typing predicate constrains a parameter to a carrier set, deferred-set
// constant, or built-in type (pkt ∈ PKT, fDes ∈ ND, nbs ⊆ ND, x ↦ y ∈ ND × ND).
// `nonVars` holds every identifier that is NOT a machine variable (the context
// sets + constants), so a bare RHS in that set means the predicate is a pure
// typing/domain constraint and must NOT become code. A variable RHS (e.g.
// `pkt ∈ middleware`) is real membership, left for rule A6. `type(x) ∈ S` is
// never flagged — its LHS has parentheses and fails the leading-\w+ anchor.
export function isTypingPredicate(expr: string, nonVars: Set<string>): boolean {
  const isType = (s: string) => nonVars.has(s) || BUILTIN_TYPES.has(s);
  let m = /^\w+\s*[∈⊆]\s*(\w+)$/.exec(expr); // x ∈ T / x ⊆ T  (bare RHS only)
  if (m && isType(m[1])) return true;
  m = /^\w+\s*↦\s*\w+\s*∈\s*(\w+)\s*×\s*(\w+)$/.exec(expr); // x ↦ y ∈ A × B
  if (m && isType(m[1]) && isType(m[2])) return true;
  m = /^\w+\s*∈\s*(\w+)\s*×\s*(\w+)$/.exec(expr); // x ∈ A × B
  if (m && isType(m[1]) && isType(m[2])) return true;
  return false;
}

function matchWhole(
  expr: string,
  enc: (id: string) => EncodingForm | undefined,
): Fragment | null {
  for (const rule of RULES) {
    const hit = rule.match(expr);
    if (hit) {
      return {
        sourceExpr: expr,
        rule: rule.id,
        tier: rule.tier,
        form: rule.form,
        encodingForm: enc(Object.values(hit.captures)[0]),
        cpp: rule.emit(hit, enc),
        provenance: rule.provenance,
      };
    }
  }
  return null;
}

// Translate one guard/action into zero or more C++ fragments. Pure typing
// conjuncts are dropped; every remaining clause is translated independently, so
// a guard like `x ∈ dom(R) ∧ y = f(x)` yields BOTH clauses instead of only
// whichever a single unanchored rule happened to match first.
export function translateExpr(
  expr: string,
  enc: (id: string) => EncodingForm | undefined,
  nonVars: Set<string>,
): Fragment[] {
  const out: Fragment[] = [];
  for (const clause of splitConjuncts(expr.trim())) {
    if (isTypingPredicate(clause, nonVars)) continue;
    const frag = matchWhole(clause, enc);
    if (frag) out.push(frag);
  }
  return out;
}

export function translate(model: EncodedModel): Fragment[] {
  const enc = (id: string) => model.encodings.get(id);
  const nonVars = new Set<string>([...model.sets, ...model.constants]);
  const out: Fragment[] = [];
  const seen = new Set<string>();

  for (const m of model.machines) {
    for (const ev of m.events) {
      for (const item of [...ev.guards, ...ev.actions]) {
        for (const frag of translateExpr(item.text, enc, nonVars)) {
          if (seen.has(frag.sourceExpr)) continue;
          seen.add(frag.sourceExpr);
          out.push(frag);
        }
      }
    }
  }
  return out;
}
