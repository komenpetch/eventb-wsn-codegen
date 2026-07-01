import type { GeneratedTree, GeneratedFile } from "./types";
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

function parsedMachines(files: EbFiles) {
  if (files.length === 0)
    throw new Error("No Event-B files selected. Choose a folder of Rodin .bum files.");
  const raw = parseModel(files);
  if (raw.machines.length === 0)
    throw new Error("No Event-B machine (.bum) found in the selection.");
  return raw;
}

// The machine labels available in the project, in parsed (file) order. The tool
// is name-agnostic: any refinement chain (pM1/uM2/pM3/uM4/pM5/…) is supported.
export function machineNames(files: EbFiles): string[] {
  return parseModel(files).machines.map((m) => m.name);
}

// Generate one class for a single target machine, flattened over its refines
// chain (base first). `outputName` is the emitted class/file name.
export function generate(files: EbFiles, target: string, outputName: string): GeneratedTree {
  const raw = parsedMachines(files);
  return emit(resolveEncodings(flatten(raw, target)), outputName);
}

// Generate a class for EVERY machine in the project — each machine flattened
// over its own refines chain. Names are derived by `nameFor` (default
// "<Label>App"). Returns every file concatenated (Pm1App.*, Um2App.*, …). In a
// refinement chain the most-refined (leaf) machine is the complete model; the
// earlier machines are its progressively-abstract snapshots.
export function generateAll(
  files: EbFiles,
  nameFor: (machine: string) => string = defaultName,
): GeneratedTree {
  const raw = parsedMachines(files);
  const out: GeneratedFile[] = [];
  for (const m of raw.machines)
    out.push(...emit(resolveEncodings(flatten(raw, m.name)), nameFor(m.name)));
  return out;
}
