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
> working SensorApp-shaped shell. When the model has the CommPattern `send_down`/`send_up` pair,
> those two event methods themselves carry SensorApp's packet-flow structure (transmit and receive);
> binding the model identities at the two marked extension points is the step you complete by hand —
> see [What it does / doesn't do](#what-it-does--doesnt-do).

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
```

`scripts/generate.ts` reads a folder of Event-B `.bum` files, **merges the whole refinement chain**
into one module (the most-refined machine, flattened), and stages `eb_helpers.h` / `eb_context.h`
next to it. Then syntax-check the generated `.cc` against real INET 4.5 headers — the project's
single measurable success criterion (Form 01 §6). The exact toolchain paths and command are in
**[scripts/compile-gate.md](scripts/compile-gate.md)**; the merged module passes `-fsyntax-only`.

---

## Output: three files (the merged module)

| File | Role |
|---|---|
| `<Name>.h` / `<Name>.cc` | INET 4.5 `ApplicationBase` subclass shaped like INET's `SensorApp`; one guarded `bool` method per Event-B event |
| `<Name>.ned` | standalone `simple <Name> like IApp` module bound to the class via `@class`, with SensorApp's parameters, signals, and statistics |

The generated class is a working **SensorApp-shaped shell**, and the SensorApp packet-flow
structures are **merged into the model's own CommPattern events** when it has them (thesis
Steps S4/S5): `send_down(...)` runs its Event-B guards, then SensorApp's transmit structure
(build a packet, tag it, `socket->send` — the `SensorApp::sendSensorPacket` body); `send_up(...)`
runs its guards, then the receive accounting, then its Event-B state actions. A model without the
pair gets SensorApp's own `sendSensorPacket()` as fallback. `handleMessageWhenUp` dispatches the
sensing timer (send-down flow) and socket messages (send-up flow via `socketDataArrived`);
lifecycle handlers open/close the `L3Socket`; the public constructor is seeded from
`INITIALISATION`; state fields are ENC-typed. It `#include`s the two shared headers `eb_helpers.h`
(pair-set `inDom`/`inRan`) and `eb_context.h` (element aliases + context constants).

### What it does / doesn't do

**Generated for you:** the model's state fields (typed by encoding form ENC1–6), the SensorApp-shaped
shell (timer, socket, lifecycle), one guarded `bool` method per event — early-return guards followed
by the translated action statements — and, for the CommPattern `send_down`/`send_up` pair, the
SensorApp transmit/receive structures merged inside those methods.

**Hand-completed:** binding the model identities at the two marked `EXTENSION POINT` comments —
in `handleMessageWhenUp` (which node/packet ids drive `start_tx`/`send_down` when the timer fires)
and in `socketDataArrived` (which ids the delivered packet maps to for `send_up`). The generator
produces the structures; it cannot know the protocol-specific identity mapping between simulation
packets and model elements.

### Dropping into OMNeT++/INET

For a compile-and-run recipe against a real INET 4.5 project (toolchain paths, `opp_makemake` flags,
and headless-run notes) see **[docs/OMNETPP_INTEGRATION.md](docs/OMNETPP_INTEGRATION.md)**.

---

## Project layout

```
src/engine/     six-stage pipeline: parser → flattener → encodingResolver →
                rules → ruleEngine → codeEmitter (pipeline.ts wires them)
src/assets/     eb_helpers.h + eb_context.h (shared C++ headers, copied into output)
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
