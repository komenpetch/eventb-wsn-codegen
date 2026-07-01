import { useRef, useState, type DragEvent } from "react";
import { generate } from "./engine/pipeline";
import { parseModel } from "./engine/parser";
import { readFolder, readZip, writeTree } from "./io/fileOutput";

type EbFiles = { name: string; xml: string }[];

// A sensible default C++ class/file name for a chosen target machine label,
// e.g. "pM3" → "Pm3App". Fully editable by the user.
const defaultName = (target: string) =>
  target ? target.charAt(0).toUpperCase() + target.slice(1) + "App" : "";

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<EbFiles>([]);
  const [machines, setMachines] = useState<string[]>([]);
  const [target, setTarget] = useState("");
  const [outputName, setOutputName] = useState("");
  const zipInput = useRef<HTMLInputElement>(null);
  const append = (s: string) => setLog((l) => [...l, s]);

  // Load Event-B files from any source (folder picker, zip button, drag-drop)
  // and detect the machine labels the user can pick as the generation target.
  // The most-refined machine (last in the parsed order) is the default target.
  async function loadWith(read: () => Promise<EbFiles>) {
    setBusy(true);
    try {
      const f = await read();
      const names = parseModel(f).machines.map((m) => m.name);
      setFiles(f);
      setMachines(names);
      const t = names[names.length - 1] ?? "";
      setTarget(t);
      setOutputName(defaultName(t));
      append(`Loaded ${f.length} file(s); machines: ${names.join(", ") || "(none found)"}.`);
    } catch (e) {
      // A cancelled picker rejects with AbortError — a normal user choice.
      if ((e as Error).name === "AbortError") append("Cancelled.");
      else append(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  // Generate the three INET C++ files for the chosen target machine + output
  // name, then let the user save them (folder in Chrome/Edge, zip elsewhere).
  async function runGenerate() {
    if (!files.length) return append("Load Event-B files first.");
    if (!target) return append("Pick a target machine.");
    if (!outputName.trim()) return append("Enter an output name.");
    setBusy(true);
    try {
      append(`Generating ${outputName.trim()} from ${target}…`);
      const tree = generate(files, target, outputName.trim());
      const mode = await writeTree(tree);
      append(
        mode === "folder"
          ? `✓ Wrote ${tree.length} files (${tree.map((f) => f.path).join(", ")}) to chosen folder.`
          : `✓ Downloaded generated-cpp.zip (${tree.length} files).`,
      );
    } catch (e) {
      if ((e as Error).name === "AbortError") append("Cancelled.");
      else append(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  function pickFolder() {
    append("Selecting Event-B folder…");
    void loadWith(readFolder);
  }

  function pickZip(file: File | undefined) {
    if (!file) return;
    append(`Reading ${file.name}…`);
    void loadWith(() => readZip(file));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    const file = Array.from(e.dataTransfer.files).find((f) => /\.zip$/i.test(f.name));
    if (!file) {
      append("Drop a .zip file (a zipped Rodin project).");
      return;
    }
    pickZip(file);
  }

  return (
    <div
      className={
        "min-h-screen bg-gray-50 p-8 font-mono text-gray-900 " +
        (dragging ? "ring-4 ring-inset ring-blue-300" : "")
      }
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <h1 className="text-xl font-bold text-gray-900">wsn-codegen</h1>
      <p className="mt-1 text-sm text-gray-600">
        Generate compilable OMNeT++/INET&nbsp;4.5 C++ from a pattern-based WSN Event-B model.
      </p>

      <div className="mt-4 max-w-2xl space-y-2 text-sm text-gray-700">
        <p>
          Load a folder of Event-B <code>.bum</code> files (a Rodin project export of the
          shared-decomposition pattern machines <code>pM1</code>/<code>uM2</code>/<code>pM3</code>)
          — or a <code>.zip</code> of that project. Pick a <strong>target machine</strong> and an{" "}
          <strong>output name</strong>; the tool flattens the machine's refinement chain and
          emits exactly three files — <code>&lt;Name&gt;.h</code>, <code>&lt;Name&gt;.cc</code>,{" "}
          <code>&lt;Name&gt;.ned</code> — to a folder you choose (Chrome/Edge) or a downloaded zip.
        </p>
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-amber-900">
          <strong>Application layer.</strong> The generated class is an{" "}
          <code>inet::RoutingProtocolBase</code> subclass with each Event-B event translated to a
          guarded <code>bool</code> method. The imperative network-layer message wiring (the{" "}
          <code>handleMessageWhenUp</code> body) is the documented next step you complete by hand.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={pickFolder}
          disabled={busy}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Working…" : "Load Event-B folder"}
        </button>
        <button
          onClick={() => zipInput.current?.click()}
          disabled={busy}
          className="rounded border border-blue-600 px-4 py-2 text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          or load a .zip
        </button>
        <input
          ref={zipInput}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => {
            pickZip(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      <p className="mt-2 text-xs text-gray-500">…or drag a .zip anywhere onto this page.</p>

      {machines.length > 0 && (
        <div className="mt-5 flex max-w-2xl flex-wrap items-end gap-4 rounded border border-gray-200 bg-white p-4">
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Target machine
            <select
              value={target}
              disabled={busy}
              onChange={(e) => {
                setTarget(e.target.value);
                setOutputName(defaultName(e.target.value));
              }}
              className="rounded border border-gray-300 px-2 py-1"
            >
              {machines.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Output name
            <input
              type="text"
              value={outputName}
              disabled={busy}
              onChange={(e) => setOutputName(e.target.value)}
              placeholder="Pm3App"
              className="rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <button
            onClick={() => void runGenerate()}
            disabled={busy}
            className="rounded bg-green-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Working…" : "Generate → save"}
          </button>
        </div>
      )}

      <pre className="mt-3 h-64 overflow-auto rounded bg-black p-3 text-green-400">
        {log.length
          ? log.join("\n")
          : "Log output appears here. No Rodin export handy? Load the bundled tests/fixtures/shdecom folder."}
      </pre>
    </div>
  );
}
