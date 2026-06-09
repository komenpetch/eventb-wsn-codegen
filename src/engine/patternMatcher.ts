import type { ResolvedModel, DetectedPatterns, RouteTableBinding } from "./types";

const has = (m: ResolvedModel, id: string) =>
  m.variableTypes.has(id) || m.machines.some((mc) => mc.variables.includes(id));

export function matchPatterns(model: ResolvedModel): DetectedPatterns {
  return {
    comm: {
      packetVars: ["ndBuff", "WiMedium", "finalDestAddr"].filter((v) => has(model, v)),
      floodTableVar: has(model, "floodTbl") ? "floodTbl" : undefined,
    },
    route: matchRouteTable(model),
    env: {
      linkVar: has(model, "wsnLinks") ? "wsnLinks" : undefined,
      neighbourVars: ["ctlNeighbours", "envNeighbours"].filter((v) => has(model, v)),
    },
  };
}

function matchRouteTable(model: ResolvedModel): RouteTableBinding | undefined {
  const pairVars = ["fwdRouteTbl", "bwdRouteTbl"].filter((v) => has(model, v));
  if (pairVars.length) return { kind: "pair", tableVars: pairVars };
  if (has(model, "neighbourTbl")) return { kind: "single", tableVars: ["neighbourTbl"] };
  if (has(model, "dsrPath")) return { kind: "source-cache", tableVars: ["dsrPath"] };
  return undefined;
}
