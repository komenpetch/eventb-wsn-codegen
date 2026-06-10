import { XMLParser } from "fast-xml-parser";
import type { RawModel, RawMachine, RawContext, RawEvent, Labelled } from "./types";

const EB = "org.eventb.core.";

// fast-xml-parser returns untyped objects keyed by EB element/attribute name.
// A value is either an attribute string, a single child node, or an array of
// child nodes (for the element types forced to arrays below).
type XmlNode = { [key: string]: string | XmlNode | XmlNode[] | undefined };

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

// Typed readers over the untyped node shape: `attr` pulls an attribute string,
// `childNode` a single child element, `nodes` a (possibly forced) array of them.
const attr = (n: XmlNode, key: string): string => n[key] as string;
const childNode = (n: XmlNode, key: string): XmlNode | undefined =>
  n[key] as XmlNode | undefined;
const nodes = (n: XmlNode, key: string): XmlNode[] =>
  asArray<XmlNode>(n[key] as XmlNode | XmlNode[] | undefined);

function baseName(fileName: string): string {
  return fileName.replace(/\.(bum|buc)$/i, "");
}

export function parseModel(files: { name: string; xml: string }[]): RawModel {
  const machines: RawMachine[] = [];
  const contexts: RawContext[] = [];

  for (const { name, xml } of files) {
    const root = parser.parse(xml) as XmlNode;
    const machineFile = childNode(root, `${EB}machineFile`);
    const contextFile = childNode(root, `${EB}contextFile`);
    if (machineFile) {
      machines.push(parseMachine(baseName(name), machineFile));
    } else if (contextFile) {
      contexts.push(parseContext(baseName(name), contextFile));
    }
    // NB: we read root[...] children only; the text_representation attribute is never touched.
  }
  return { machines, contexts };
}

function parseMachine(name: string, node: XmlNode): RawMachine {
  const refinesNode = childNode(node, `${EB}refinesMachine`);
  return {
    name,
    refines: refinesNode ? attr(refinesNode, `${EB}target`) : undefined,
    sees: nodes(node, `${EB}seesContext`).map((s) => attr(s, `${EB}target`)),
    variables: nodes(node, `${EB}variable`).map((v) => attr(v, `${EB}identifier`)),
    invariants: nodes(node, `${EB}invariant`).map(labelPred),
    events: nodes(node, `${EB}event`).map(parseEvent),
  };
}

function parseEvent(node: XmlNode): RawEvent {
  const refinesNode = nodes(node, `${EB}refinesEvent`)[0];
  return {
    label: attr(node, `${EB}label`),
    refines: refinesNode ? attr(refinesNode, `${EB}target`) : undefined,
    extended: node[`${EB}extended`] === "true",
    parameters: nodes(node, `${EB}parameter`).map((p) => attr(p, `${EB}identifier`)),
    guards: nodes(node, `${EB}guard`).map(labelPred),
    actions: nodes(node, `${EB}action`).map(labelAssign),
  };
}

function parseContext(name: string, node: XmlNode): RawContext {
  const extNode = childNode(node, `${EB}extendsContext`);
  return {
    name,
    extendsCtx: extNode ? attr(extNode, `${EB}target`) : undefined,
    sets: nodes(node, `${EB}carrierSet`).map((s) => attr(s, `${EB}identifier`)),
    constants: nodes(node, `${EB}constant`).map((c) => attr(c, `${EB}identifier`)),
    axioms: nodes(node, `${EB}axiom`).map(labelPred),
  };
}

const labelPred = (n: XmlNode): Labelled => ({ label: attr(n, `${EB}label`), text: attr(n, `${EB}predicate`) });
const labelAssign = (n: XmlNode): Labelled => ({ label: attr(n, `${EB}label`), text: attr(n, `${EB}assignment`) });
