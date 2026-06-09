// Rule-coverage diagnostic: for each case study, report how much of the real
// .bum guard/action content the rule engine translates, using the SAME engine
// path the generator uses (conjunction splitting + typing-predicate skipping).
// Pure typing predicates (pkt ∈ PKT) are reported separately — they are not
// "uncovered", they are intentionally non-executable.
//
//   npx vite-node scripts/analyze.ts
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { parseModel } from "../src/engine/parser";
import { resolveModel } from "../src/engine/model";
import { matchPatterns } from "../src/engine/patternMatcher";
import { resolveEncodings } from "../src/engine/encodingResolver";
import {
  translateExpr,
  isTypingPredicate,
  splitConjuncts,
} from "../src/engine/ruleEngine";

function loadDir(dir: string) {
  return readdirSync(dir)
    .filter((f) => /\.(bum|buc)$/.test(f))
    .map((f) => ({ name: f, xml: readFileSync(resolve(dir, f), "utf8") }));
}

for (const proto of ["rtmcs", "mintroute"]) {
  const model = resolveModel(parseModel(loadDir(`tests/fixtures/${proto}`)));
  const encoded = resolveEncodings(model, matchPatterns(model));
  const enc = (id: string) => encoded.encodings.get(id);
  const nonVars = new Set<string>([...encoded.sets, ...encoded.constants]);

  const exprs = new Set<string>();
  for (const m of encoded.machines)
    for (const ev of m.events)
      for (const item of [...ev.guards, ...ev.actions])
        exprs.add(item.text.trim());

  let typingOnly = 0;
  let fully = 0;
  let partial = 0;
  let unmatched = 0;
  let clauseTotal = 0;
  let clauseMatched = 0;
  const fire: Record<string, number> = {};
  const unmatchedClauses: string[] = [];
  const sample: Record<string, string> = {};

  for (const expr of exprs) {
    const nonTyping = splitConjuncts(expr).filter(
      (c) => !isTypingPredicate(c, nonVars),
    );
    const frags = translateExpr(expr, enc, nonVars);
    for (const f of frags) {
      fire[f.rule] = (fire[f.rule] ?? 0) + 1;
      if (!sample[f.rule]) sample[f.rule] = `${f.sourceExpr}  =>  ${f.cpp}`;
    }
    clauseTotal += nonTyping.length;
    clauseMatched += frags.length;

    if (nonTyping.length === 0) {
      typingOnly++;
    } else if (frags.length === 0) {
      unmatched++;
      unmatchedClauses.push(...nonTyping);
    } else if (frags.length >= nonTyping.length) {
      fully++;
    } else {
      partial++;
      const matched = new Set(frags.map((f) => f.sourceExpr));
      unmatchedClauses.push(...nonTyping.filter((c) => !matched.has(c)));
    }
  }

  const exec = exprs.size - typingOnly;
  const pct = (a: number, b: number) => (b === 0 ? "n/a" : `${((100 * a) / b).toFixed(1)}%`);
  console.log(`\n========== ${proto.toUpperCase()} ==========`);
  console.log(`unique guard/action expressions : ${exprs.size}`);
  console.log(`pure typing (skipped, no code)  : ${typingOnly}`);
  console.log(`executable expressions          : ${exec}`);
  console.log(`  fully translated              : ${fully}`);
  console.log(`  partially translated          : ${partial}`);
  console.log(`  unmatched                     : ${unmatched}`);
  console.log(`expr-level coverage (>=1 clause): ${fully + partial}/${exec} = ${pct(fully + partial, exec)}`);
  console.log(`clause-level coverage           : ${clauseMatched}/${clauseTotal} = ${pct(clauseMatched, clauseTotal)}`);
  console.log(
    `rules fired: ` +
      Object.keys(fire)
        .sort()
        .map((id) => `${id}(${fire[id]})`)
        .join(" "),
  );

  console.log(`\n-- one emitted sample per firing rule --`);
  for (const id of Object.keys(sample).sort())
    console.log(`  [${id}] ${sample[id]}`);

  console.log(`\n-- sample unmatched clauses (first 25, deduped) --`);
  for (const u of [...new Set(unmatchedClauses)].slice(0, 25)) console.log(`  ${u}`);
}
