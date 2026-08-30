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

export interface TranslatedEvent {
  label: string;
  parameters: string[];
  guards: string[];
  actions: string[];
  // Clauses no rule matched (typing guards excluded). The emitter surfaces
  // them as // UNTRANSLATED comments — a dropped guard would silently weaken
  // the event's precondition, a dropped action its effect.
  untranslatedGuards: string[];
  untranslatedActions: string[];
}

// Opt-in accounting for the benchmark only. The framework's step 2, Rule
// Mapping, is encoding resolution PLUS rule application, but rule application
// happens inside the emitter, which also does the assembly belonging to step 3.
// Measured on the case study, rule application is about 56 % of the emitter's
// time, so attributing all of it to step 3 misreports both steps by more than a
// factor of two. This counter lets the benchmark split them without the emitter
// having to know about timing. Off unless the benchmark turns it on, so the
// shipped tool pays nothing.
export const ruleClock = { on: false, ms: 0 };

export function translateEvent(ev: FlatEvent, model: EncodedMachine): TranslatedEvent {
  if (ruleClock.on) {
    ruleClock.on = false;                       // avoid re-entry double counting
    const t = performance.now();
    try { return translateEvent(ev, model); }
    finally { ruleClock.ms += performance.now() - t; ruleClock.on = true; }
  }
  const enc = (id: string) => model.encodings.get(id);
  // Machine-only: any identifier that is neither a machine variable nor an
  // event parameter is a context name (ND, Dests, type, …) for typing-guard
  // detection. Parameters must NOT count as types: `x ∈ nbrs` with nbrs a
  // set-typed parameter is a semantic guard (SET1), not a typing predicate —
  // treating it as typing would drop it silently (RTMCS/MintRoute
  // assign_forwarder's `nb ∈ nbs` is a real instance).
  const params = new Set(ev.parameters);
  const nonVars = new Set<string>();
  for (const t of [...ev.guards, ...ev.actions])
    for (const tok of t.match(/[A-Za-z_]\w*/g) ?? [])
      if (!model.variables.includes(tok) && !params.has(tok)) nonVars.add(tok);

  const guards: string[] = [];
  const untranslatedGuards: string[] = [];
  for (const g of ev.guards)
    for (const clause of splitConjuncts(g)) {
      if (isTypingPredicate(clause, nonVars)) continue;
      const cpp = matchWhole(clause, enc);
      if (cpp) guards.push(cpp);
      else untranslatedGuards.push(clause);
    }
  const actions: string[] = [];
  const untranslatedActions: string[] = [];
  for (const a of ev.actions) {
    const cpp = matchWhole(a.trim(), enc);
    if (cpp) actions.push(cpp);
    else untranslatedActions.push(a.trim());
  }

  return { label: ev.label, parameters: ev.parameters, guards, actions, untranslatedGuards, untranslatedActions };
}
