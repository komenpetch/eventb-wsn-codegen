// ── Stage 1: Parser output ──────────────────────────────────────────────
export interface RawModel { machines: RawMachine[]; contexts: RawContext[]; }
export interface RawMachine {
  name: string;
  refines?: string;            // target machine name
  sees: string[];              // seen context names
  variables: string[];
  invariants: Labelled[];      // predicate carried in `.text`
  events: RawEvent[];
}
export interface RawEvent {
  label: string;
  refines?: string;            // refined event label, if any
  extended: boolean;
  parameters: string[];
  guards: Labelled[];          // predicate in `.text`
  actions: Labelled[];         // assignment in `.text`
}
export interface RawContext {
  name: string;
  extendsCtx?: string;
  sets: string[];
  constants: string[];
  axioms: Labelled[];
}
export interface Labelled { label: string; text: string; }

// ── Stage 2: Model output ───────────────────────────────────────────────
export type Protocol = "RTMCS" | "MintRoute" | "DSR";
export interface ResolvedModel {
  protocol: Protocol;
  machines: ResolvedMachine[];               // ordered M0..Mn
  sets: string[];
  constants: string[];
  variableTypes: Map<string, string>;        // identifier → invariant predicate (raw Unicode)
}
export interface ResolvedMachine {
  name: string;
  variables: string[];
  events: RawEvent[];                        // merged across refines chain
}

// ── Stage 3: PatternMatcher output ──────────────────────────────────────
export interface DetectedPatterns {
  comm: CommBinding;                         // always present
  route?: RouteTableBinding;
  env: EnvBinding;
}
export interface CommBinding { packetVars: string[]; floodTableVar?: string; }
export interface RouteTableBinding {
  kind: "pair" | "single" | "source-cache";  // RTMCS/DSR | MintRoute | DSR-cache
  tableVars: string[];                       // fwdRouteTbl, bwdRouteTbl, neighbourTbl, dsrPath…
}
export interface EnvBinding { linkVar?: string; neighbourVars: string[]; }

// ── Stage 4: EncodingResolver output ────────────────────────────────────
export type EncodingForm = "function" | "pair-keyed" | "map-of-sets" | "pair-set";
export interface EncodedModel extends ResolvedModel {
  encodings: Map<string, EncodingForm>;      // identifier → chosen C++ container form
}

// ── Stage 5: RuleEngine output ──────────────────────────────────────────
export type RuleId = string;                 // "R1".."R20" | "A1".."A5"
export interface Fragment {
  sourceExpr: string;
  rule: RuleId;
  tier: 1 | 2 | 3 | "aux";
  form?: "A" | "B" | "C";
  encodingForm?: EncodingForm;
  cpp: string;
  provenance: "raw-XML" | "PDF-only";
}

// ── Stage 6: CodeEmitter output ─────────────────────────────────────────
export interface VirtualFile { path: string; content: string; }
export type VirtualFileTree = VirtualFile[];
