// Headless generation CLI for the compile gate: generate INET C++ for the three
// shDecom6_2 pattern machines into out/, then stage the shared headers so each
// <name>.cc can be syntax-checked against INET (see scripts/compile-gate.md).
//
//   npm run generate            # writes to out/
//   npm run generate -- <dir>   # writes to <dir>
//
// Run via vite-node so TS + engine imports resolve without a build step.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { generate } from "../src/engine/pipeline";

const FIX = "tests/fixtures/shdecom";
const OUT = process.argv[2] ?? "out";

const load = (n: string) => ({ name: `${n}.bum`, xml: readFileSync(`${FIX}/${n}.bum`, "utf8") });

// Each target machine is flattened over its full refines chain, base first.
const targets = [
  { files: ["pM1"], target: "pM1", name: "Pm1App" },
  { files: ["pM1", "uM2"], target: "uM2", name: "Um2App" },
  { files: ["pM1", "uM2", "pM3"], target: "pM3", name: "Pm3App" },
];

mkdirSync(OUT, { recursive: true });
for (const { files, target, name } of targets) {
  const tree = generate(files.map(load), target, name);
  for (const f of tree) writeFileSync(resolve(OUT, f.path), f.content, "utf8");
  console.log(`Generated ${name}.{h,cc,ned}`);
}
// Stage the shared headers next to the generated code so #include resolves.
copyFileSync("src/assets/eb_helpers.h", resolve(OUT, "eb_helpers.h"));
copyFileSync("src/assets/eb_context.h", resolve(OUT, "eb_context.h"));
console.log(`Staged eb_helpers.h + eb_context.h in ${OUT}/`);
