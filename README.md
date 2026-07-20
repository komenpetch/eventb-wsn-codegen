# wsn-codegen

Generate compilable **OMNeT++/INET 4.5** C++ from a pattern-based **Rodin Event-B** wireless-sensor-network
model. Load a Rodin project — any refinement chain, names are not fixed (`pM1` / `uM2` / `pM3` / `uM4`
/ `pM5` / …) — and the tool **merges the whole chain** into one INET application module modelled on
INET's `SensorApp` (an `inet::ApplicationBase` subclass), emitting exactly three files — `<Name>.h`,
`<Name>.cc`, `<Name>.ned` — ready to drop into an INET simulation. (The merged module is the
most-refined machine, flattened over its refinement chain.)

It is a **client-side web app** (TypeScript + React + Vite) — nothing is uploaded; parsing and code
generation run entirely in your browser. A headless CLI + compile gate are included for scripting.

**Live demo:** https://komenpetch.github.io/wsn-codegen/

> **Application layer.** Each Event-B event is translated to a guarded `bool` method, wrapped in a
> working SensorApp-shaped shell. The CommPattern `send_down`/`send_up` pair is emitted under
> SensorApp's own names — `sendSensorPacket(...)` (transmit) and a `socketDataArrived(...)` overload
> (receive) — carrying SensorApp's packet-flow structure inside the Event-B guards/actions; binding
> the model identities at the two marked extension points is the step you complete by hand — see
> [What it does / doesn't do](#what-it-does--doesnt-do).

---

## Quick start

Prerequisites: **Node.js 20+** and npm.

```bash
npm install
npm run dev
```

Vite serves under the GitHub Pages base path, so open the URL it prints —
**http://localhost:5173/wsn-codegen/** (not the bare `/`).

To preview the production build instead:

```bash
npm run build
npm run preview     # http://localhost:4173/wsn-codegen/
```

---

## Using the web app

1. Click **Load Event-B folder** (or **load a .zip**, or drag a `.zip` onto the page). No model handy?
   Use the bundled **`tests/fixtures/shdecom`** folder (`pM1.bum` / `uM2.bum` / `pM3.bum`).
2. The tool lists **every machine** it detects and the module they merge into (the most-refined
   machine; the output name defaults to `<Leaf>App` and is editable). Click **Generate → save** —
   it merges the whole chain into one module.
3. Choose where to write the three files:
   - **Chrome / Edge** — a native folder picker writes them directly (File System Access API).
   - **Firefox / Safari / mobile** — the files download as **`generated-cpp.zip`**.

The on-screen log reports each step. Cancelling a picker logs `Cancelled.` (not an error).

## Using the CLI + compile gate

```bash
npm run generate                        # tests/fixtures/shdecom → out/
npm run generate -- <inputDir> <outDir> # any Rodin project (every machine found)
npm run generate -- <inputDir> <outDir> --v1   # emitted-structure version (see below)
```

`scripts/generate.ts` reads a folder of Event-B `.bum`/`.buc` files and **merges the whole
refinement chain** into one module (the most-refined machine, flattened). Then syntax-check the
generated `.cc` against real INET 4.5 headers — the project's single measurable success criterion
(Form 01 §6). The exact toolchain paths and command are in
**[scripts/compile-gate.md](scripts/compile-gate.md)**; the merged module passes `-fsyntax-only`.

**Emitted-structure versions** (`--v1`…`--v4`, **default v4**) all pass the compile gate. v1–v3 are
**frozen** — they are the project report's compare-table evidence:

| | Structure |
|---|---|
| **v1** | the original pre-SensorApp structure (`RoutingProtocolBase`, empty lifecycle stubs, pattern pair untouched) |
| **v2** | v1 with *only* the CommPattern pair changed into the merged SensorApp functions (plus the minimal members those bodies need) |
| **v3** | the full SensorApp shell described below |
| **v4** | v3 + **SensorApp behavioural parity** and a **self-contained header** (current default) |

**v4 is the one to use.** v3 compiled and ran but transmitted nothing: the transmit call sat behind
an unbound extension point. v4 emits the baseline call, so the module reproduces `SensorApp`'s
traffic exactly (measured in an identical harness: 0 → 59/60/60 packets sent and 6 received, the
same as the baseline on every node). Similarity to `SensorApp` rose 67.3 % → 93.9 %, with the shell
at 100 % and 15/15 functions statement-identical. v4 also inlines the Event-B context and helpers
into the generated header — v1–v3 `#include` the `eb_context.h`/`eb_helpers.h` fixtures, which only
the CLI staged, so a **web download of v1–v3 could not compile**. v4 has no such dependency.

---

## Output: three files (the merged module)

| File | Role |
|---|---|
| `<Name>.h` / `<Name>.cc` | INET 4.5 `ApplicationBase` subclass shaped like INET's `SensorApp`; one guarded `bool` method per Event-B event |
| `<Name>.ned` | standalone `simple <Name> like IApp` module bound to the class via `@class`, with SensorApp's parameters, signals, and statistics |

The generated class is a working **SensorApp-shaped shell**, and the model's CommPattern events are
**emitted under SensorApp's names, merged with its structures** (thesis Steps S4/S5): Event-B
`send_down` becomes `bool sendSensorPacket(...)` — its Event-B guards, then SensorApp's transmit
structure (build a packet, tag it, `socket->send`); Event-B `send_up` becomes a
`bool socketDataArrived(...)` model overload — its guards, the receive accounting, then its Event-B
state actions. Every other event keeps its Event-B name and pure translation-rules body, and each
renamed method carries an `// Event-B: …` provenance comment. A model without the pair gets
SensorApp's own `void sendSensorPacket()` as fallback. `handleMessageWhenUp` dispatches the sensing
timer (send-down flow) and socket messages (send-up flow via the `socketDataArrived` callback);
lifecycle handlers open/close the `L3Socket`; the public constructor is seeded from
`INITIALISATION`; state fields are ENC-typed.

**In v4** the module additionally reaches `SensorApp` behaviour: the sensing timer calls the
baseline `void sendSensorPacket()`, the socket callback counts receptions, `openSocket` carries the
ipv4/ipv6/address-type fallback, and `initialize` resets the counters and registers them with
`WATCH()`. The baseline and model forms coexist as C++ overloads — `void sendSensorPacket()` does
the transmitting, while `bool sendSensorPacket(Node, PktId)` remains the translated `send_down`
event with its guards intact, still unwired. Driving the model form needs the simulation identities
bound to model elements *and* the context populated, which is the network-layer stage; the emitted
`EXTENSION POINT` comments say so at the call sites.

The Event-B context and helpers are **inlined into the generated header in v4** (element aliases,
context constants, and the pair-set `inDom`/`inRan` templates), so the output is self-contained.
Constants are derived from the project's own `.buc` contexts, each citing the axiom that fixes it
(e.g. `BROADCAST = -1` from `axm0_71`). Constants whose axioms give only properties — `ND ⊆ ℕ` names
no elements — are declared and flagged for the simulation harness to populate. v1–v3 instead
`#include` the `eb_helpers.h` / `eb_context.h` fixtures from `src/assets/`, which the CLI stages
next to the output.

### What it does / doesn't do

**Generated for you:** the model's state fields (typed by encoding form ENC1–6), the SensorApp-shaped
shell (timer, socket, lifecycle), one guarded `bool` method per event — early-return guards followed
by the translated action statements — and the CommPattern pair emitted as
`sendSensorPacket`/`socketDataArrived` with the SensorApp transmit/receive structures merged inside.

**Hand-completed:** binding the model identities at the two marked `EXTENSION POINT` comments —
in `handleMessageWhenUp` (which node/packet ids drive `start_tx`/`send_down` when the timer fires)
and in `socketDataArrived` (which ids the delivered packet maps to for `send_up`) — together with
populating the context values the harness must supply (`ND`, `Dests`, `type`, `initialSrcAddr`,
`finalDestAddr`, declared but empty, since the axioms give properties rather than elements). The
generator produces the structures; it cannot know the protocol-specific identity mapping between
simulation packets and model elements.

Note that from v4 this is no longer needed just to get a *working* module: the baseline
`sendSensorPacket()` already transmits. The hand step is what lets the **model** drive the
transmission instead of the baseline shell.

### Dropping into OMNeT++/INET

For a compile-and-run recipe against a real INET 4.5 project (toolchain paths, `opp_makemake` flags,
and headless-run notes) see **[docs/OMNETPP_INTEGRATION.md](docs/OMNETPP_INTEGRATION.md)**.

---

## Project layout

```
src/engine/     six-stage pipeline: parser → flattener → encodingResolver →
                rules → ruleEngine → codeEmitter (pipeline.ts wires them)
src/assets/     eb_helpers.h + eb_context.h (staged next to v1–v3 output; v4 inlines them)
src/io/         folder read + folder/zip write (File System Access + fallbacks)
src/App.tsx     thin UI shell (machine list + output-name; merges the whole chain)
scripts/        headless generate CLI + compile-gate.md
tests/          vitest suite + fixtures/shdecom + generation snapshots
docs/           OMNeT++/INET integration guide
out/            local-only generator output (gitignored)
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | type-check (`tsc -b`) + production build to `dist/` |
| `npm run preview` | serve the production build locally |
| `npm test` | run the vitest suite (engine unit tests + generation snapshots) |
| `npm run lint` | ESLint |
| `npm run generate` | merge a project into one module (+ shared headers) into `out/` |

Pushing to `main` deploys the built app to GitHub Pages via `.github/workflows/deploy.yml`
(it runs the tests and build first).

---

## Context

This tool is the Phase 3 deliverable of an undergraduate digital-engineering project, *Automatic Code
Generation Framework from Event-B Models for Wireless Sensor Networks*, extending the pattern-based
WSN formal-modelling work of Intana et al. (ECTI-CON 2020).

## License

See [LICENSE](LICENSE).
