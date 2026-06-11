# Generated output — OMNeT++/INET 4.5 build instructions

These files are produced by the `eventb-wsn-codegen` generator from the Event-B
case-study models. Regenerate any time with:

```bash
npm run generate -- tests/fixtures/rtmcs       generated/rtmcs
npm run generate -- tests/fixtures/mintroute   generated/mintroute
```

## Files (per protocol)

| File | Role |
|---|---|
| `<Protocol>.h` / `<Protocol>.cc` | INET 4.5 `NetworkProtocolBase` subclass (the network-layer slot) |
| `<Protocol>.ned` | module definition + topology (ENVPattern) |
| `omnetpp.ini` | simulation config (ENVPattern) |
| `eb_helpers.h` | shared templated helper library (CommPattern canonical names) |

The M4–M6 routing-event bodies (`handleUpperPacket` / `handleLowerPacket`) are
intentional **stubs** — the protocol-specific imperative routing logic is
hand-authored in Phase 4 per the project scope. The generator emits the model,
field declarations (by encoding form), patterns, and skeleton; not the routing
decisions.

## Compile + execute gate (Form 01 §6)

Toolchain on this machine:

- **OMNeT++ 6.3.0** — `C:\Users\Komen\Desktop\omnetpp-6.3.0`
- **INET 4.5** — `C:\Users\Komen\Desktop\Proj\Simulation\inet4.5`
- **MyWSN harness** — `C:\Users\Komen\Desktop\Proj\Simulation\inet4.5\MyWSN`
  (lives **inside** `inet4.5`, so INET's `src` is `../src`; the harness is **flat** —
  files sit directly in `MyWSN\`, there is no `src\` or `simulations\` subfolder)

### Quick check — compile only

`clang -fsyntax-only` against the real INET headers is cheap and needs no MSYS environment:

```powershell
$clang = "C:\Users\Komen\Desktop\omnetpp-6.3.0\tools\win32.x86_64\clang64\bin\clang++.exe"
$inet  = "C:\Users\Komen\Desktop\Proj\Simulation\inet4.5\src"
$opp   = "C:\Users\Komen\Desktop\omnetpp-6.3.0\include"
& $clang -fsyntax-only -std=c++17 -DINET_IMPORT -I. -I $inet -I $opp RTMCS.cc   # exit 0 = compiles
```

### Full gate — compile + link + Define_Module + run

1. Copy the generated files into the harness (flat — no `src\` / `simulations\`):
   ```
   copy generated\rtmcs\RTMCS.h       ...\Simulation\inet4.5\MyWSN\
   copy generated\rtmcs\RTMCS.cc      ...\Simulation\inet4.5\MyWSN\
   copy generated\rtmcs\RTMCS.ned     ...\Simulation\inet4.5\MyWSN\
   copy generated\rtmcs\eb_helpers.h  ...\Simulation\inet4.5\MyWSN\
   copy generated\rtmcs\omnetpp.ini   ...\Simulation\inet4.5\MyWSN\
   ```
2. Add a thin `RTMCSNetworkLayer.ned` wrapper (copy INET's `WiseRouteNetworkLayer`, set
   `np: RTMCS`, and drop the `arpModule=` line — generated protocols have no `arpModule`
   parameter) plus a `[Config RTMCS]` section in `omnetpp.ini`. The wrapper supplies the
   standard transport/queue gates and an `InterfaceTable`, which `NetworkProtocolBase::initialize`
   requires; a bare `simple` module fails init without them. For MintRoute, name the wrapper
   distinctly (`MintRouteGenNetworkLayer`) — INET ships its own `inet::MintRoute` and the two
   coexist.
3. Build and run from the OMNeT++ **CLANG64** shell
   (`omnetpp-6.3.0\tools\win32.x86_64\usr\bin\bash.exe`, after `source .../setenv`):
   ```bash
   cd /c/Users/Komen/Desktop/Proj/Simulation/inet4.5/MyWSN
   opp_makemake -f --deep -O out -KINET4_5_PROJ=.. -DINET_IMPORT -I. '-I$(INET4_5_PROJ)/src' '-L$(INET4_5_PROJ)/src' '-lINET$(D)'
   make MODE=release
   export PATH="/c/Users/Komen/Desktop/Proj/Simulation/inet4.5/src:$PATH"   # so the exe loads libINET.dll
   ./MyWSN.exe -u Cmdenv -c RTMCS -n ".;../src" --sim-time-limit=3s
   ```
   Use **`-KINET4_5_PROJ=..`** (not `../inet4.5`): because MyWSN lives inside `inet4.5`, INET's
   `src` is `../src`; the committed Makefile's `INET4_5_PROJ=../inet4.5` is stale. For headless
   Cmdenv also disable OSG (`*.visualizer.osgVisualizer.typename = ""`) and clear the passive
   app's sink address (`*.sensor*.app[0].sinkAddress = ""`) so initialization doesn't throw.

**Expected:** compiles, links, and runs to `t=3s` with exit 0 — the empty M4–M6 stub bodies
initialize through all stages without crashing. This satisfies the Form 01 §6 "compiles and
executes" gate. Verified for RTMCS and MintRoute against this harness, with no `codeEmitter.ts`
or `eb_helpers.h` changes needed.

If the compiler reports a missing helper or include, fix it in `src/assets/eb_helpers.h` or
`src/engine/codeEmitter.ts`, then re-generate and rebuild.
