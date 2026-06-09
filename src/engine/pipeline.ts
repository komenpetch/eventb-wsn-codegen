import type { VirtualFileTree } from "./types";
import { parseModel } from "./parser";
import { resolveModel } from "./model";
import { matchPatterns } from "./patternMatcher";
import { resolveEncodings } from "./encodingResolver";
import { translate } from "./ruleEngine";
import { emit } from "./codeEmitter";

export function generate(files: { name: string; xml: string }[]): VirtualFileTree {
  const resolved = resolveModel(parseModel(files));
  const patterns = matchPatterns(resolved);
  const encoded = resolveEncodings(resolved, patterns);
  const fragments = translate(encoded);
  return emit(encoded, fragments);
}
