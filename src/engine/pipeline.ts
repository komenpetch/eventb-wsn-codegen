import type { VirtualFileTree } from "./types";
import { parseModel } from "./parser";
import { resolveModel } from "./model";
import { matchPatterns } from "./patternMatcher";
import { resolveEncodings } from "./encodingResolver";
import { translate } from "./ruleEngine";
import { emit } from "./codeEmitter";

export function generate(files: { name: string; xml: string }[]): VirtualFileTree {
  // Guard the wrong-folder mistake: without this, an empty or non-Event-B
  // selection parses to an empty model and emit() still produces a phantom
  // default-DSR module — a silent failure the user has no way to notice.
  if (files.length === 0) {
    throw new Error(
      "No Event-B files selected. Choose a folder containing Rodin .bum/.buc files (for example tests/fixtures/rtmcs).",
    );
  }
  const resolved = resolveModel(parseModel(files));
  if (resolved.machines.length === 0) {
    throw new Error(
      "No Event-B machine (.bum) files found in the selection. At least one machine is required to generate a protocol module.",
    );
  }
  const patterns = matchPatterns(resolved);
  const encoded = resolveEncodings(resolved, patterns);
  const fragments = translate(encoded);
  return emit(encoded, fragments);
}
