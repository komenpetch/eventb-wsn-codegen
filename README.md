# wsn-codegen

Generate compilable **OMNeT++/INET 4.5** C++ from a pattern-based **Rodin Event-B** wireless-sensor-network
model. Load a Rodin project — any refinement chain, names are not fixed (`pM1` / `uM2` / `pM3` / `uM4`
/ `pM5` / …) — and the tool generates, for **every machine** it finds, three files — `<Name>.h`,
`<Name>.cc`, `<Name>.ned` — an `inet::RoutingProtocolBase` subclass, each flattened over its own
refinement chain, ready to drop into an INET simulation.

It is a **client-side web app** (TypeScript + React + Vite) — nothing is uploaded; parsing and code
generation run entirely in your browser. A headless CLI + compile gate are included for scripting.

**Live demo:** https://komenpetch.github.io/wsn-codegen/

> **Application layer.** Each Event-B event is translated to a guarded `bool` method. The imperative
> network-layer message wiring (the `handleMessageWhenUp` body) is the documented next step you
> complete by hand — see [What it does / doesn't do](#what-it-does--doesnt-do).

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
2. The tool lists **every machine** it detects and the class names it will emit. Click
   **Generate all → save** — it generates one class per machine (each flattened over its own
   `refines` chain, named `<Label>App`).
3. Choose where to write the files:
   - **Chrome / Edge** — a native folder picker writes them directly (File System Access API).
   - **Firefox / Safari / mobile** — the files download as **`generated-cpp.zip`**.

The on-screen log reports each step. Cancelling a picker logs `Cancelled.` (not an error).

## Using the CLI + compile gate

```bash
npm run generate                        # tests/fixtures/shdecom → out/
npm run generate -- <inputDir> <outDir> # any Rodin project (every machine found)
```

`scripts/generate.ts` reads a folder of Event-B `.bum` files and generates a class for **every
machine** it finds (each flattened over its own `refines` chain), staging `eb_helpers.h` /
`eb_context.h` next to them. Then syntax-check each `.cc` against real INET 4.5 headers — the
project's single measurable success criterion (Form 01 §6). The exact toolchain paths and command are
in **[scripts/compile-gate.md](scripts/compile-gate.md)**; every generated machine passes `-fsyntax-only`.

---

## Output: three files per machine

| File | Role |
|---|---|
| `<Name>.h` / `<Name>.cc` | INET 4.5 `RoutingProtocolBase` subclass; one guarded `bool` method per Event-B event |
| `<Name>.ned` | `simple <Name> extends RoutingProtocolBase` module definition |

The generated class carries the four `OperationalBase` overrides (`handleMessageWhenUp`,
`handleStartOperation`, `handleStopOperation`, `handleCrashOperation`) as empty stubs, a public
constructor seeded from `INITIALISATION`, and ENC-typed state fields. It `#include`s the two shared
headers `eb_helpers.h` (pair-set `inDom`/`inRan`) and `eb_context.h` (element aliases + context
constants).

### What it does / doesn't do

**Generated for you:** the model's state fields (typed by encoding form ENC1–6), the class scaffold
(base class, overrides, constructor), and one guarded `bool` method per event — early-return guards
(the translated predicates) followed by the translated action statements.

**Hand-completed:** the imperative network-layer message handling (the `handleMessageWhenUp` body that
receives packets and calls these event methods). The generator produces the app-layer scaffold and the
per-event logic, not the packet-dispatch wiring.

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
src/App.tsx     thin UI shell (target-machine + output-name)
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
| `npm run generate` | generate every machine in a folder (+ shared headers) into `out/` |

Pushing to `main` deploys the built app to GitHub Pages via `.github/workflows/deploy.yml`
(it runs the tests and build first).

---

## Context

This tool is the Phase 3 deliverable of an undergraduate digital-engineering project, *Automatic Code
Generation Framework from Event-B Models for Wireless Sensor Networks*, extending the pattern-based
WSN formal-modelling work of Intana et al. (ECTI-CON 2020).

## License

See [LICENSE](LICENSE).
