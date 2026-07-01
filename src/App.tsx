import { useRef, useState, type DragEvent } from "react";
import { generateAll, machineNames, defaultName } from "./engine/pipeline";
import { readFolder, readZip, writeTree } from "./io/fileOutput";

type EbFiles = { name: string; xml: string }[];

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<EbFiles>([]);
  const [machines, setMachines] = useState<string[]>([]);
  const zipInput = useRef<HTMLInputElement>(null);
  const append = (s: string) => setLog((l) => [...l, s]);

  // Load Event-B files from any source (folder picker, zip button, drag-drop)
  // and detect every machine in the project. The tool is name-agnostic — any
  // refinement chain (pM1/uM2/pM3/uM4/pM5/…) is supported.
  async function loadWith(read: () => Promise<EbFiles>) {
    setBusy(true);
    try {
      const f = await read();
      const names = machineNames(f);
      setFiles(f);
      setMachines(names);
      append(`Loaded ${f.length} file(s); machines: ${names.join(", ") || "(none found)"}.`);
    } catch (e) {
      // A cancelled picker rejects with AbortError — a normal user choice.
      if ((e as Error).name === "AbortError") append("Cancelled.");
      else append(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  // Generate a class for EVERY machine in the project (each flattened over its
  // own refines chain), then let the user save the whole set.
  async function runGenerate() {
    if (!files.length) return append("Load Event-B files first.");
    setBusy(true);
    try {
      append(`Generating ${machines.length} machine(s)…`);
      const tree = generateAll(files);
      const mode = await writeTree(tree);
      append(
        mode === "folder"
          ? `✓ Wrote ${tree.length} files to chosen folder.`
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
          <code>.zip</code> of that project. The tool detects <strong>every machine</strong> in the
          project and generates a class for each, flattening its refinement chain and emitting three
          files — <code>&lt;Name&gt;.h</code>, <code>&lt;Name&gt;.cc</code>, <code>&lt;Name&gt;.ned</code>{" "}
          — to a folder you choose (Chrome/Edge) or a downloaded zip. Any refinement chain
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
        <div className="mt-5 max-w-2xl rounded border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-700">
            <strong>{machines.length} machine(s)</strong> → will generate:{" "}
            {machines.map((m) => defaultName(m)).join(", ")}
          </p>
          <button
            onClick={() => void runGenerate()}
            disabled={busy}
            className="mt-3 rounded bg-green-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Working…" : "Generate all → save"}
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
