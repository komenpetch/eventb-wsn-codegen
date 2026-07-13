# Generated output — OMNeT++/INET 4.5 integration

The `wsn-codegen` generator **merges a project's refinement chain** into one module (the
most-refined machine, flattened) and emits three files:

| File | Role |
|---|---|
| `<Name>.h` / `<Name>.cc` | INET 4.5 `inet::ApplicationBase` subclass shaped like INET's `SensorApp` (`inet/applications/sensorapp`); one guarded `bool` method per Event-B event |
| `<Name>.ned` | standalone `simple <Name> like IApp` module bound to the class via `@class`, mirroring `SensorApp.ned`'s parameters, signals, and statistics |

plus the two shared headers the generated code `#include`s: `eb_helpers.h` (pair-set
`inDom`/`inRan`) and `eb_context.h` (element aliases + context constants). Regenerate any
folder of Event-B `.bum` files with:

```bash
npm run generate -- <inputDir> <outDir>    # every machine found → <outDir>
npm run generate                           # tests/fixtures/shdecom → out/
```

The class is a working **SensorApp-shaped shell**, with the SensorApp packet-flow structures
**merged into the model's CommPattern events** when present (thesis S4/S5): `send_down(...)` =
Event-B guards + the `SensorApp::sendSensorPacket` transmit structure; `send_up(...)` = Event-B
guards + receive accounting + Event-B actions. A model without the pair gets SensorApp's own
`sendSensorPacket()` as fallback. `handleMessageWhenUp` dispatches timer/socket messages; the
lifecycle handlers open/close an `L3Socket` bound to the `networkProtocol` NED parameter; the
public constructor is seeded from `INITIALISATION`. The **hand-completed next step** is the
identity binding at the two marked `EXTENSION POINT` comments (in `handleMessageWhenUp`: which
node/packet ids drive the transmit chain; in `socketDataArrived`: which ids a delivered packet
maps to for `send_up`); the generator produces the structures, not the protocol-specific mapping
between simulation packets and model elements.

## Toolchain on this machine

- **OMNeT++ 6.3.0** — `C:\Users\Komen\Desktop\omnetpp-6.3.0`
- **INET 4.5** — `C:\Users\Komen\Desktop\Proj\Simulation\inet4.5`

## Compile gate (Form 01 §6) — automated, verified

`clang -fsyntax-only` against the real INET 4.5 headers is the project's automated success
criterion. It is cheap and needs no MSYS environment. `npm run generate` stages the shared
headers next to the `.cc` files, so `-I out` resolves the includes:

```bash
CLANG="C:/Users/Komen/Desktop/omnetpp-6.3.0/tools/win32.x86_64/clang64/bin/clang++.exe"
INET_SRC="C:/Users/Komen/Desktop/Proj/Simulation/inet4.5/src"
OPP_INC="C:/Users/Komen/Desktop/omnetpp-6.3.0/include"
for cc in out/*.cc; do
  "$CLANG" -fsyntax-only -std=c++17 -DINET_IMPORT -I out -I "$INET_SRC" -I "$OPP_INC" "$cc"
done
```

`-DINET_IMPORT` and `-I "$OPP_INC"` are mandatory (otherwise `omnetpp.h` is not found and INET's
export macros mis-expand). **Status: the merged module passes, exit 0.** See
[`scripts/compile-gate.md`](../scripts/compile-gate.md).

## Full run (compile + link + execute) — hand-completion step

Executing in the simulator (the "and executes" half of Form 01 §6) requires two hand-authored
pieces the app-layer generator does not emit:

1. **The identity binding** — at the extension points in `handleMessageWhenUp` /
   `socketDataArrived`, call the model's event methods with the right node/packet identities
   (the protocol-specific mapping). The structures themselves — timer, socket, dispatch,
   lifecycle, and the transmit/receive bodies inside `send_down`/`send_up` — are already
   generated.
2. **A simulation to host the module** — a network `.ned` that instantiates `<Name>` as `app[0]`
   on the nodes (it is an `IApp`), and an `omnetpp.ini` `[Config]` setting `sinkAddress` /
   `networkProtocol`.

Then build and run from the OMNeT++ **CLANG64** shell
(`omnetpp-6.3.0\tools\win32.x86_64\usr\bin\bash.exe`, after `source .../setenv`):

```bash
# in a project folder that sees INET's src as ../src
opp_makemake -f --deep -O out -KINET4_5_PROJ=.. -DINET_IMPORT -I. '-I$(INET4_5_PROJ)/src' '-L$(INET4_5_PROJ)/src' '-lINET$(D)'
make MODE=release
export PATH="/c/Users/Komen/Desktop/Proj/Simulation/inet4.5/src:$PATH"   # load libINET.dll
./<sim>.exe -u Cmdenv -c <Config> -n ".;../src" --sim-time-limit=3s
```

For headless Cmdenv, disable OSG (`*.visualizer.osgVisualizer.typename = ""`) so init doesn't
throw. Use `-KINET4_5_PROJ=..` when the project folder lives inside `inet4.5` (INET's `src` is then
`../src`).

If the compiler reports a missing helper or include, fix it in `src/assets/eb_helpers.h` or
`src/engine/codeEmitter.ts`, then re-generate and rebuild.
