import { XMLParser } from "fast-xml-parser";
import type { RawModel, RawMachine, RawContext, RawEvent, Labelled } from "./types";

const EB = "org.eventb.core.";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  // Force these element types to always be arrays even when singular:
  isArray: (name) =>
    [
      `${EB}variable`, `${EB}invariant`, `${EB}event`, `${EB}guard`,
      `${EB}action`, `${EB}parameter`, `${EB}carrierSet`, `${EB}constant`,
      `${EB}axiom`, `${EB}refinesEvent`, `${EB}seesContext`,
    ].includes(name),
});

function asArray<T>(v: T | T[] | undefined): T[] {
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

function baseName(fileName: string): string {
  return fileName.replace(/\.(bum|buc)$/i, "");
}

export function parseModel(files: { name: string; xml: string }[]): RawModel {
  const machines: RawMachine[] = [];
  const contexts: RawContext[] = [];

  for (const { name, xml } of files) {
    const root = parser.parse(xml);
    if (root[`${EB}machineFile`]) {
      machines.push(parseMachine(baseName(name), root[`${EB}machineFile`]));
    } else if (root[`${EB}contextFile`]) {
      contexts.push(parseContext(baseName(name), root[`${EB}contextFile`]));
    }
    // NB: we read root[...] children only; the text_representation attribute is never touched.
  }
  return { machines, contexts };
}

function parseMachine(name: string, node: any): RawMachine {
  const refinesNode = node[`${EB}refinesMachine`];
  return {
    name,
    refines: refinesNode ? refinesNode[`${EB}target`] : undefined,
    sees: asArray(node[`${EB}seesContext`]).map((s: any) => s[`${EB}target`]),
    variables: asArray(node[`${EB}variable`]).map((v: any) => v[`${EB}identifier`]),
    invariants: asArray(node[`${EB}invariant`]).map(labelPred),
    events: asArray(node[`${EB}event`]).map(parseEvent),
  };
}

function parseEvent(node: any): RawEvent {
  const refinesNode = asArray(node[`${EB}refinesEvent`])[0];
  return {
    label: node[`${EB}label`],
    refines: refinesNode ? refinesNode[`${EB}target`] : undefined,
    extended: node[`${EB}extended`] === "true",
    parameters: asArray(node[`${EB}parameter`]).map((p: any) => p[`${EB}identifier`]),
    guards: asArray(node[`${EB}guard`]).map(labelPred),
    actions: asArray(node[`${EB}action`]).map(labelAssign),
  };
}

function parseContext(name: string, node: any): RawContext {
  const extNode = node[`${EB}extendsContext`];
  return {
    name,
    extendsCtx: extNode ? extNode[`${EB}target`] : undefined,
    sets: asArray(node[`${EB}carrierSet`]).map((s: any) => s[`${EB}identifier`]),
    constants: asArray(node[`${EB}constant`]).map((c: any) => c[`${EB}identifier`]),
    axioms: asArray(node[`${EB}axiom`]).map(labelPred),
  };
}

const labelPred = (n: any): Labelled => ({ label: n[`${EB}label`], text: n[`${EB}predicate`] });
const labelAssign = (n: any): Labelled => ({ label: n[`${EB}label`], text: n[`${EB}assignment`] });
