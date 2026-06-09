import type { EncodedModel, Fragment } from "./types";
import { RULES } from "./rules";

export function translate(model: EncodedModel): Fragment[] {
  const enc = (id: string) => model.encodings.get(id);
  const out: Fragment[] = [];
  const seen = new Set<string>();

  for (const m of model.machines) {
    for (const ev of m.events) {
      for (const item of [...ev.guards, ...ev.actions]) {
        const expr = item.text.trim();
        if (seen.has(expr)) continue;
        for (const rule of RULES) {
          const hit = rule.match(expr);
          if (hit) {
            out.push({
              sourceExpr: expr,
              rule: rule.id,
              tier: rule.tier,
              form: rule.form,
              encodingForm: enc(Object.values(hit.captures)[0]),
              cpp: rule.emit(hit, enc),
              provenance: rule.provenance,
            });
            seen.add(expr);
            break; // first matching rule wins (RULES is most-specific-first)
          }
        }
      }
    }
  }
  return out;
}
