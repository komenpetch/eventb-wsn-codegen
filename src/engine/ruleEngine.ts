import type { EncodedMachine, FlatEvent, EncodingForm } from "./types";
import { RULES } from "./rules";

export function splitConjuncts(expr: string): string[] {
  const parts: string[] = []; let depth = 0, start = 0;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "∧" && depth === 0) { parts.push(expr.slice(start, i)); start = i + 1; }
  }
  parts.push(expr.slice(start));
  return parts.map((s) => s.trim()).filter((s) => s.length > 0);
}

const BUILTIN_TYPES = new Set(["ℕ", "ℕ1", "ℤ", "BOOL", "𝔹", "PKT", "ND"]);

export function isTypingPredicate(expr: string, nonVars: Set<string>): boolean {
  const isType = (s: string) => nonVars.has(s) || BUILTIN_TYPES.has(s);
  // x ∈ T / x ⊆ T (bare RHS) — but NOT x ∈ A ∖ B (CMP1), whose RHS contains ∖.
  // \S+ (not \w+): the built-in carriers ℤ / ℕ / 𝔹 are outside \w.
  const m = /^\w+\s*[∈⊆]\s*(\S+)$/.exec(expr);
  if (m && isType(m[1])) return true;
  // nbrs ∈ {n∣ n ∈ ℙ(ND)} — set-builder typing, drop.
  if (/^\w+\s*∈\s*\{.*∣.*\}$/.test(expr)) return true;
  return false;
}

function matchWhole(expr: string, enc: (id: string) => EncodingForm | undefined): string | null {
  for (const rule of RULES) { const hit = rule.match(expr); if (hit) return rule.emit(hit, enc); }
  return null;
}

export interface TranslatedEvent { label: string; parameters: string[]; guards: string[]; actions: string[]; }

export function translateEvent(ev: FlatEvent, model: EncodedMachine): TranslatedEvent {
  const enc = (id: string) => model.encodings.get(id);
  // Machine-only: any identifier that is not a machine variable is a context
  // name (ND, Dests, type, …) for the purpose of typing-guard detection.
  const nonVars = new Set<string>();
  for (const t of [...ev.guards, ...ev.actions])
    for (const tok of t.match(/[A-Za-z_]\w*/g) ?? [])
      if (!model.variables.includes(tok)) nonVars.add(tok);

  const guards: string[] = [];
  for (const g of ev.guards)
    for (const clause of splitConjuncts(g)) {
      if (isTypingPredicate(clause, nonVars)) continue;
      const cpp = matchWhole(clause, enc);
      if (cpp) guards.push(cpp);
    }
  const actions: string[] = [];
  for (const a of ev.actions) { const cpp = matchWhole(a.trim(), enc); if (cpp) actions.push(cpp); }

  return { label: ev.label, parameters: ev.parameters, guards, actions };
}
