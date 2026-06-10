import { useRef, useState, type DragEvent } from "react";
import { generate } from "./engine/pipeline";
import { readFolder, readZip, writeTree } from "./io/fileOutput";

type EbFiles = { name: string; xml: string }[];

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const zipInput = useRef<HTMLInputElement>(null);
  const append = (s: string) => setLog((l) => [...l, s]);

  // Shared tail: take the parsed Event-B files from any input source (folder
  // picker, zip button, or drag-drop), generate, and write the output. Only the
  // read step differs per source.
  async function runWith(read: () => Promise<EbFiles>) {
    setBusy(true);
    try {
      const files = await read();
      append(`Read ${files.length} file(s). Generating…`);
      const tree = generate(files);
      append(`Generated ${tree.length} files. Choose where to save…`);
      const mode = await writeTree(tree);
      append(mode === "folder" ? "✓ Written to chosen folder." : "✓ Downloaded generated-cpp.zip.");
    } catch (e) {
      // A cancelled folder/save picker rejects with AbortError — that is a
      // normal user choice, not a failure, so don't render it as an error.
      if ((e as Error).name === "AbortError") append("Cancelled.");
      else append(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  function pickFolder() {
    append("Selecting Event-B folder…");
    void runWith(readFolder);
  }

  function pickZip(file: File | undefined) {
    if (!file) return;
    append(`Reading ${file.name}…`);
    void runWith(() => readZip(file));
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
      <h1 className="text-xl font-bold text-gray-900">eventb-wsn-codegen</h1>
      <p className="mt-1 text-sm text-gray-600">
        Generate compilable OMNeT++/INET&nbsp;4.5 C++ from a Rodin Event-B model.
      </p>

      <div className="mt-4 max-w-2xl space-y-2 text-sm text-gray-700">
        <p>
          Pick a folder of Event-B <code>.bum</code>/<code>.buc</code> files (a Rodin
          project export) — or a <code>.zip</code> of that project. The tool detects the
          protocol and writes five files: <code>&lt;Protocol&gt;.h</code>, <code>.cc</code>,{" "}
          <code>.ned</code>, <code>omnetpp.ini</code> and <code>eb_helpers.h</code> — to a
          folder you choose (Chrome/Edge) or as a downloaded zip (other browsers).
        </p>
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-amber-900">
          <strong>Scaffold, not full routing logic.</strong> The generator emits the
          model fields, state encodings, detected patterns, the network-layer skeleton
          and the ENV/topology config, plus the translated guard/action fragments as
          reference comments. The M4–M6 routing event bodies
          (<code>handleUpperPacket</code>/<code>handleLowerPacket</code>) are intentional
          stubs you complete by hand — see the generated <code>README</code>.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={pickFolder}
          disabled={busy}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Working…" : "Pick Event-B folder → Generate"}
        </button>
        <button
          onClick={() => zipInput.current?.click()}
          disabled={busy}
          className="rounded border border-blue-600 px-4 py-2 text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          or pick a .zip
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

      <pre className="mt-3 h-64 overflow-auto rounded bg-black p-3 text-green-400">
        {log.length
          ? log.join("\n")
          : "Log output appears here. No Rodin export handy? Try the bundled tests/fixtures/rtmcs folder."}
      </pre>
    </div>
  );
}
