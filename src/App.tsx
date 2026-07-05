import { useRef, useState, type DragEvent } from "react";
import { generateMerged, machineNames, leafMachine, defaultName } from "./engine/pipeline";
import { readFolder, readZip, writeTree } from "./io/fileOutput";

type EbFiles = { name: string; xml: string }[];

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<EbFiles>([]);
  const [machines, setMachines] = useState<string[]>([]);
  const [outputName, setOutputName] = useState("");
  const zipInput = useRef<HTMLInputElement>(null);
  const append = (s: string) => setLog((l) => [...l, s]);

  // Load Event-B files from any source (folder picker, zip button, drag-drop)
  // and detect every machine. The tool is name-agnostic — any refinement chain
  // (pM1/uM2/pM3/uM4/pM5/…) is supported. The output name defaults to the
  // most-refined (leaf) machine, which the whole project merges into.
  async function loadWith(read: () => Promise<EbFiles>) {
    setBusy(true);
    try {
      const f = await read();
      const names = f.length ? machineNames(f) : [];
      setFiles(f);
      setMachines(names);
      setOutputName(names.length ? defaultName(leafMachine(f)) : "");
      if (names.length) {
        append(`Loaded ${f.length} file(s); machines (base → leaf): ${names.join(" → ")}.`);
      } else if (f.length) {
        append(`Loaded ${f.length} file(s) but none is an Event-B machine (.bum).`);
      } else {
        // Folder picking is not recursive: the picked folder itself must hold
        // the .bum files (a Rodin project folder is flat).
        append(
          "No .bum/.buc files found. Pick the Rodin project folder itself " +
          "(the one that directly contains the .bum files), or load a .zip of it.",
        );
      }
    } catch (e) {
      // A cancelled picker rejects with AbortError — a normal user choice.
      if ((e as Error).name === "AbortError") append("Cancelled.");
      else append(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  // Merge the whole project into one module (the most-refined machine, flattened
  // over its refines chain) and let the user save the three files.
  async function runGenerate() {
    if (!files.length) return append("Load Event-B files first.");
    if (!outputName.trim()) return append("Enter an output name.");
    setBusy(true);
    try {
      append(`Merging ${machines.length} machine(s) into ${outputName.trim()}…`);
      const tree = generateMerged(files, outputName.trim());
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
          Load a folder of Event-B <code>.bum</code> files (a Rodin project export) — or a{" "}
          <code>.zip</code> of that project. The tool detects every machine, <strong>merges the whole
          refinement chain</strong> into one module, and emits exactly three files —{" "}
          <code>&lt;Name&gt;.h</code>, <code>&lt;Name&gt;.cc</code>, <code>&lt;Name&gt;.ned</code> — to a
          folder you choose (Chrome/Edge) or a downloaded zip. Any chain
          (<code>pM1/uM2/pM3/uM4/pM5/…</code>) works — names are not fixed.
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
          <p className="w-full text-sm text-gray-700">
            <strong>{machines.length} machine(s)</strong> ({machines.join(" → ")}) → merged into one
            module ({outputName || "…"}.h/.cc/.ned).
          </p>
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
