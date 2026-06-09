// Headless generation CLI: parse a folder of Event-B .bum/.buc files and write
// the generated C++/.ned/omnetpp.ini/eb_helpers.h to an output directory.
//
//   npx vite-node scripts/generate.ts <inputDir> <outputDir>
//   npm run generate -- <inputDir> <outputDir>
//
// Run via vite-node so the engine's `eb_helpers.h?raw` import resolves the same
// way it does in the browser build.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { generate } from "../src/engine/pipeline";

const inDir = process.argv[2] ?? "tests/fixtures/rtmcs";
const outDir = process.argv[3] ?? "generated";

const files = readdirSync(inDir)
  .filter((f) => /\.(bum|buc)$/.test(f))
  .map((f) => ({ name: f, xml: readFileSync(resolve(inDir, f), "utf8") }));

const tree = generate(files);
mkdirSync(outDir, { recursive: true });
for (const f of tree) writeFileSync(resolve(outDir, f.path), f.content, "utf8");

console.log(`Generated ${tree.length} files from ${inDir} -> ${outDir}/`);
for (const f of tree) console.log("  " + f.path);
