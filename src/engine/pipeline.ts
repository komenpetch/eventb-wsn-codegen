import type { GeneratedTree, RawModel } from "./types";
import { parseModel } from "./parser";
import { flatten } from "./flattener";
import { resolveEncodings } from "./encodingResolver";
import { emit } from "./codeEmitter";

export type EbFiles = { name: string; xml: string }[];

// A default C++ class/file name for a machine label: "pM3" → "Pm3App".
export function defaultName(machine: string): string {
  return machine
    ? machine.charAt(0).toUpperCase() + machine.slice(1).toLowerCase() + "App"
    : "App";
}

function parsedMachines(files: EbFiles): RawModel {
  if (files.length === 0)
    throw new Error("No Event-B files selected. Choose a folder of Rodin .bum files.");
  const raw = parseModel(files);
  if (raw.machines.length === 0)
    throw new Error("No Event-B machine (.bum) found in the selection.");
  return raw;
}

// Refinement depth of each machine (1 = base). Shared by leaf detection and
// chain-ordered listing.
function depthFn(raw: RawModel): (name: string) => number {
  const byName = new Map(raw.machines.map((m) => [m.name, m]));
  return (name: string): number => {
    let d = 0;
    const seen = new Set<string>();
    let cur = byName.get(name);
    while (cur) {
      if (seen.has(cur.name))
        throw new Error(`Refinement cycle detected at machine '${cur.name}'.`);
      seen.add(cur.name);
      d++;
      cur = cur.refines ? byName.get(cur.refines) : undefined;
    }
    return d;
  };
}

// The most-refined machine — the leaf of the deepest refines chain. Flattening
// it yields the merged model: all ancestors' state + events in one class.
function leafOf(raw: RawModel): string {
  const depth = depthFn(raw);
  // Deepest chain wins; ties fall back to parse order (stable sort).
  return raw.machines.map((m) => m.name).sort((a, b) => depth(b) - depth(a))[0];
}

// The machine labels in the project, ordered base → leaf along the refines
// chain (file order breaks ties), so displays like "pM1 → uM2 → pM3" reflect
// refinement, not directory listing. Name-agnostic — any chain works.
export function machineNames(files: EbFiles): string[] {
  const raw = parseModel(files);
  const depth = depthFn(raw);
  return raw.machines.map((m) => m.name).sort((a, b) => depth(a) - depth(b));
}

// The machine the project merges into (the most-refined / leaf machine).
export function leafMachine(files: EbFiles): string {
  return leafOf(parsedMachines(files));
}

// Generate one class for a single target machine, flattened over its refines
// chain (base first). `outputName` is the emitted class/file name.
export function generate(files: EbFiles, target: string, outputName: string): GeneratedTree {
  return emit(resolveEncodings(flatten(parsedMachines(files), target)), outputName);
}

// Merge the whole project into ONE module: generate from the most-refined
// machine, whose flattened form subsumes the entire refinement chain. Emits
// exactly three files (<name>.h/.cc/.ned). `outputName` defaults to the leaf's
// derived name.
export function generateMerged(files: EbFiles, outputName?: string): GeneratedTree {
  const raw = parsedMachines(files);
  const leaf = leafOf(raw);
  return emit(resolveEncodings(flatten(raw, leaf)), outputName ?? defaultName(leaf));
}
