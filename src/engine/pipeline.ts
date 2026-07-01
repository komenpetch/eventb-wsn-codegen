import type { GeneratedTree } from "./types";
import { parseModel } from "./parser";
import { flatten } from "./flattener";
import { resolveEncodings } from "./encodingResolver";
import { emit } from "./codeEmitter";

export function generate(
  files: { name: string; xml: string }[],
  target: string,
  outputName: string,
): GeneratedTree {
  if (files.length === 0)
    throw new Error("No Event-B files selected. Choose the shDecom6_2 .bum files (pM1/uM2/pM3).");
  const raw = parseModel(files);
  if (raw.machines.length === 0)
    throw new Error("No Event-B machine (.bum) found in the selection.");
  const flat = flatten(raw, target);
  const encoded = resolveEncodings(flat);
  return emit(encoded, outputName);
}
