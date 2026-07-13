// Headless generation CLI for the compile gate: parse a folder of Event-B .bum
// files, MERGE the whole refinement chain into one module (the most-refined
// machine, flattened), and stage the shared headers so the generated <name>.cc
// can be syntax-checked against INET (see scripts/compile-gate.md). Machine
// names are not fixed — any chain (pM1/uM2/pM3/uM4/pM5/…) works.
//
//   npm run generate                        # tests/fixtures/shdecom → out/
//   npm run generate -- <inputDir> <outDir>
//   npm run generate -- <inputDir> <outDir> --v1   # emitted-structure version
//
// --v1/--v2/--v3 selects the emitted structure for the report's compare table
// (1 = original RoutingProtocolBase, 2 = only the CommPattern pair changed,
// 3 = full SensorApp shell; default 3).
//
// Run via vite-node so TS + engine imports resolve without a build step.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateMerged, machineNames, leafMachine } from "../src/engine/pipeline";
import type { EmitVersion } from "../src/engine/codeEmitter";

const flag = process.argv.find((a) => /^--v[123]$/.test(a));
const version = (flag ? Number(flag.slice(3)) : 3) as EmitVersion;
const positional = process.argv.slice(2).filter((a) => !/^--v[123]$/.test(a));
const inDir = positional[0] ?? "tests/fixtures/shdecom";
const outDir = positional[1] ?? "out";

const files = readdirSync(inDir)
  .filter((f) => /\.(bum|buc)$/.test(f))
  .map((f) => ({ name: f, xml: readFileSync(resolve(inDir, f), "utf8") }));

mkdirSync(outDir, { recursive: true });
const tree = generateMerged(files, undefined, version);
for (const f of tree) writeFileSync(resolve(outDir, f.path), f.content, "utf8");

// Stage the shared headers next to the generated code so #include resolves.
copyFileSync("src/assets/eb_helpers.h", resolve(outDir, "eb_helpers.h"));
copyFileSync("src/assets/eb_context.h", resolve(outDir, "eb_context.h"));

console.log(`Machines (${inDir}): ${machineNames(files).join(", ")} → merged into ${leafMachine(files)}`);
console.log(`Generated ${tree.length} files (structure v${version}) + shared headers → ${outDir}/`);
