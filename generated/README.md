# Generated output — OMNeT++/INET 4.5 build instructions (Task 13)

These files are produced by the `eventb-wsn-codegen` generator from the Event-B
case-study models. Regenerate any time with:

```bash
npm run generate -- tests/fixtures/rtmcs       generated/rtmcs
npm run generate -- tests/fixtures/mintroute   generated/mintroute
```

## Files (per protocol)

| File | Role |
|---|---|
| `<Protocol>.h` / `<Protocol>.cc` | INET 4.5 `NetworkProtocolBase` subclass (the `ipv4` network-layer slot) |
| `<Protocol>.ned` | module definition + topology (ENVPattern) |
| `omnetpp.ini` | simulation config (ENVPattern) |
| `eb_helpers.h` | shared templated helper library (CommPattern canonical names) |

The M4–M6 routing-event bodies (`handleUpperPacket` / `handleLowerPacket`) are
intentional **stubs** — the protocol-specific imperative routing logic is
hand-authored in Phase 4 per the project scope. The generator emits the model,
field declarations (by encoding form), patterns, and skeleton; not the routing
decisions.

## Compile + execute gate (Form 01 §6)

Toolchain located on this machine:

- **OMNeT++ 6.3.0** — `C:\Users\Komen\Desktop\omnetpp-6.3.0`
- **INET 4.5** — `C:\Users\Komen\Desktop\Proj\Simulation\inet4.5`
- **MyWSN project** — `C:\Users\Komen\Desktop\Proj\Simulation\MyWSN`

Run these from the **OMNeT++ IDE** (or its `mingwenv` shell), where the toolchain
and the INET dependency are already wired:

1. Copy the generated RTMCS files into MyWSN:
   ```
   copy generated\rtmcs\RTMCS.h       ...\Simulation\MyWSN\src\
   copy generated\rtmcs\RTMCS.cc      ...\Simulation\MyWSN\src\
   copy generated\rtmcs\RTMCS.ned     ...\Simulation\MyWSN\src\
   copy generated\rtmcs\eb_helpers.h  ...\Simulation\MyWSN\src\
   copy generated\rtmcs\omnetpp.ini   ...\Simulation\MyWSN\simulations\
   ```
2. Ensure MyWSN references INET 4.5 (Project ▸ Properties ▸ Project References ▸ `inet4.5`)
   so `#include "inet/networklayer/base/NetworkProtocolBase.h"` resolves.
3. Build: `opp_makemake -f --deep` (with the INET include/lib flags the MyWSN
   makefrag already uses) then `make` — or simply **Build** in the IDE.
4. Run the simulation with the generated `omnetpp.ini`.

**Expected:** compiles, and runs without crash (stub event bodies). This satisfies
the Form 01 §6 "compiles and executes" gate for the generated scaffold.

If the compiler reports a missing helper or include, fix it in
`src/assets/eb_helpers.h` or `src/engine/codeEmitter.ts`, then re-generate and
rebuild.
