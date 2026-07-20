# INET Compile Gate — Form 01 §6 Success Criterion

The framework's single measurable success criterion is that the generated C++
compiles against OMNeT++/INET. This gate `-fsyntax-only`-checks each generated
application-layer `.cc` against the real INET 4.5 headers.

## Prerequisites (local toolchain paths)

| Var | Path |
|---|---|
| `CLANG`   | `C:/Users/Komen/Desktop/omnetpp-6.3.0/tools/win32.x86_64/clang64/bin/clang++.exe` |
| `INET_SRC`| `C:/Users/Komen/Desktop/Proj/Simulation/inet4.5/src` |
| `OPP_INC` | `C:/Users/Komen/Desktop/omnetpp-6.3.0/include` |

## Run

```bash
# 1. Merge the project into one module + shared headers into out/
npm run generate                        # tests/fixtures/shdecom → out/
# npm run generate -- <inputDir> <out>  # any Rodin project

# 2. Syntax-check each generated .cc against INET (exit 0 = pass)
CLANG="C:/Users/Komen/Desktop/omnetpp-6.3.0/tools/win32.x86_64/clang64/bin/clang++.exe"
INET_SRC="C:/Users/Komen/Desktop/Proj/Simulation/inet4.5/src"
OPP_INC="C:/Users/Komen/Desktop/omnetpp-6.3.0/include"
for cc in out/*.cc; do
  "$CLANG" -fsyntax-only -std=c++17 -DINET_IMPORT -I out -I "$INET_SRC" -I "$OPP_INC" "$cc"
done
```

`-DINET_IMPORT` and `-I "$OPP_INC"` are mandatory: without the OMNeT++ include
path `omnetpp.h` is not found, and without `-DINET_IMPORT` INET's export macros
mis-expand. `-I out` lets each `.cc` find its own header; for v1–v3 it also
resolves `eb_helpers.h` / `eb_context.h`, which `npm run generate` stages next to
the generated code. **v4 needs no staged headers** — it inlines them, so the gate
passes with only the three generated files present, which is what makes the
output self-contained on the web path as well as the CLI.

## Result (2026-07-13)

The merged module passes `-fsyntax-only` (exit 0):

| Project | Merged into | Output | Gate |
|---|---|---|---|
| shDecom6_2 (pM1→uM2→pM3) | pM3 (leaf) | `Pm3App.{h,cc,ned}` | ✓ exit 0 |

The generated class is an `inet::ApplicationBase` subclass shaped like INET's
`SensorApp` (`inet/applications/sensorapp`). Each Event-B event becomes a
guarded `bool` method; the CommPattern pair is emitted under SensorApp's
names, merged with its structures (thesis S4/S5): Event-B `send_down` →
`bool sendSensorPacket(...)` = guards + the SensorApp transmit body; Event-B
`send_up` → `bool socketDataArrived(...)` model overload = guards + receive
accounting + actions (fallback `void sendSensorPacket()` when a model has no
such pair). `handleMessageWhenUp` dispatches timer/socket messages; lifecycle
handlers open/close an `L3Socket`. The documented next step is the identity
binding at the two marked `EXTENSION POINT` comments.

(2026-07-01 result under the previous `RoutingProtocolBase` empty-stub shell:
same gate, exit 0.)
