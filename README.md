# eventb-wsn-codegen

Generate compilable **OMNeT++/INET 4.5** C++ from a **Rodin Event-B** wireless-sensor-network
model. Point the tool at a folder of `.bum`/`.buc` files; it detects the protocol and emits a
`NetworkProtocolBase` subclass plus the `.ned`, `omnetpp.ini` and helper header needed to drop the
module into an INET simulation.

It is a **client-side web app** (TypeScript + React + Vite) — nothing is uploaded; parsing and code
generation run entirely in your browser. A headless CLI is included for scripting.

**Live demo:** https://komenpetch.github.io/eventb-wsn-codegen/

> **Scaffold, not full routing logic.** The generator emits the model fields, state encodings,
> detected patterns, the network-layer skeleton, the ENV/topology config, and the translated
> guard/action fragments (as reference comments). The M4–M6 routing event bodies
> (`handleUpperPacket` / `handleLowerPacket`) are **intentional stubs you complete by hand** — see
> [What it does / doesn't do](#what-it-does--doesnt-do).

---

## Quick start

Prerequisites: **Node.js 20+** and npm.

```bash
npm install
npm run dev
```

Vite serves under the GitHub Pages base path, so open the URL it prints —
**http://localhost:5173/eventb-wsn-codegen/** (not the bare `/`).

To preview the production build instead:

```bash
npm run build
npm run preview     # http://localhost:4173/eventb-wsn-codegen/
```

---

## Using the web app

1. Click **Pick Event-B folder → Generate**.
2. Choose a folder containing Rodin `.bum`/`.buc` files. No model handy? Use the bundled
   **`tests/fixtures/rtmcs`** or **`tests/fixtures/mintroute`**.
3. Choose where to save the output:
   - **Chrome / Edge** — a native folder picker writes the files directly (File System Access API).
   - **Firefox / Safari / mobile** — the files download as **`generated-cpp.zip`**.

The on-screen log reports each step (`Read N file(s)`, `Generated 5 files`, `Written…`/`Downloaded…`).
Cancelling either picker logs `Cancelled.` (not an error). Selecting a folder with no Event-B files
logs an actionable message instead of producing anything.

## Using the CLI

```bash
npm run generate -- <inputDir> <outputDir>
# example:
npm run generate -- tests/fixtures/rtmcs generated/rtmcs
```

Reads every `.bum`/`.buc` in `<inputDir>` and writes the five files to `<outputDir>`. Exits non-zero
with a one-line message if the folder contains no Event-B model. Output is deterministic — the same
model always produces byte-identical files.

---

## Output: five files per protocol

`<Protocol>` is detected from the model (`RTMCS`, `MintRoute`, or `DSR`).

| File | Role |
|---|---|
| `<Protocol>.h` / `<Protocol>.cc` | INET 4.5 `NetworkProtocolBase` subclass (the network-layer slot) |
| `<Protocol>.ned` | module definition + topology (ENVPattern) |
| `omnetpp.ini` | simulation config (ENVPattern) |
| `eb_helpers.h` | shared templated helper library (CommPattern canonical names) |

The `.cc` carries a one-line **detected-patterns** header and a **translated guard/action fragments**
reference block — the rule-engine's C++ for each Event-B fragment, as comments — to guide the M4–M6
hand-completion.

### What it does / doesn't do

**Generated for you:** model fields (typed by encoding form), state encodings, detected patterns
(CommPattern / RouteTable / ENVPattern), the concrete network-layer skeleton (all pure virtuals
overridden so the module compiles), the `.ned` + `omnetpp.ini`, and the translated-fragment
reference comments.

**Hand-completed (Phase 4):** the M4–M6 imperative routing logic inside `handleUpperPacket` /
`handleLowerPacket`. These are deliberately empty stubs — the generator produces the scaffold and the
exact translated fragments to paste in, not the protocol's routing decisions.

### Dropping into OMNeT++/INET

The generated module is an `ipv4`-slot `NetworkProtocolBase` subclass. For the verified
compile-and-run recipe against a real INET 4.5 project (toolchain paths, the `NetworkLayer.ned`
wrapper, `opp_makemake` flags, and the headless-run gotchas), see
**[generated/README.md](generated/README.md)**.

---

## Project layout

```
src/engine/     six-stage pipeline: parser → model → patternMatcher →
                encodingResolver → ruleEngine → codeEmitter (pipeline.ts wires them)
src/io/         folder read + folder/zip write (File System Access + fallbacks)
src/App.tsx     thin UI shell
scripts/        headless generate CLI (+ analyze helper)
tests/          vitest suite + fixtures (rtmcs, mintroute)
generated/      committed sample output + OMNeT++/INET build instructions
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | type-check (`tsc -b`) + production build to `dist/` |
| `npm run preview` | serve the production build locally |
| `npm test` | run the vitest suite |
| `npm run lint` | ESLint |
| `npm run generate -- <in> <out>` | headless code generation |

Pushing to `main` deploys the built app to GitHub Pages via `.github/workflows/deploy.yml`
(it runs the tests and build first).

---

## Context

This tool is the Phase 3 deliverable of an undergraduate digital-engineering project, *Automatic Code
Generation Framework from Event-B Models for Wireless Sensor Networks*, extending the pattern-based
WSN formal-modelling work of Intana et al. (ECTI-CON 2020). The patterns it emits (CommPattern,
RouteTable, ENVPattern) were extracted from three case studies — DSR, AODV/RTMCS, and MintRoute.

## License

See [LICENSE](LICENSE).
