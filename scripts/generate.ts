// Headless generation CLI for the compile gate: parse a folder of Event-B .bum
// files, generate a C++ class for EVERY machine found, and stage the shared
// headers so each <name>.cc can be syntax-checked against INET (see
// scripts/compile-gate.md). Machine names are not fixed — any refinement chain
// (pM1/uM2/pM3/uM4/pM5/…) works.
//
//   npm run generate                        # tests/fixtures/shdecom → out/
//   npm run generate -- <inputDir> <outDir>
//
// Run via vite-node so TS + engine imports resolve without a build step.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateAll, machineNames } from "../src/engine/pipeline";

const inDir = process.argv[2] ?? "tests/fixtures/shdecom";
const outDir = process.argv[3] ?? "out";

const files = readdirSync(inDir)
  .filter((f) => /\.(bum|buc)$/.test(f))
  .map((f) => ({ name: f, xml: readFileSync(resolve(inDir, f), "utf8") }));

mkdirSync(outDir, { recursive: true });
const tree = generateAll(files);
for (const f of tree) writeFileSync(resolve(outDir, f.path), f.content, "utf8");

// Stage the shared headers next to the generated code so #include resolves.
copyFileSync("src/assets/eb_helpers.h", resolve(outDir, "eb_helpers.h"));
copyFileSync("src/assets/eb_context.h", resolve(outDir, "eb_context.h"));

console.log(`Machines (${inDir}): ${machineNames(files).join(", ")}`);
console.log(`Generated ${tree.length} files + shared headers → ${outDir}/`);
