import { useState } from "react";
import { generate } from "./engine/pipeline";
import { readFolder, writeTree } from "./io/fileOutput";

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const append = (s: string) => setLog((l) => [...l, s]);

  async function run() {
    setBusy(true);
    try {
      append("Selecting Event-B folder…");
      const files = await readFolder();
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-mono">
      <h1 className="text-xl font-bold text-gray-900">eventb-wsn-codegen</h1>
      <p className="mt-1 text-sm text-gray-600">
        Generate compilable OMNeT++/INET&nbsp;4.5 C++ from a Rodin Event-B model.
      </p>

      <div className="mt-4 max-w-2xl space-y-2 text-sm text-gray-700">
        <p>
          Pick a folder of Event-B <code>.bum</code>/<code>.buc</code> files (a Rodin
          project export). The tool detects the protocol and writes five files:{" "}
          <code>&lt;Protocol&gt;.h</code>, <code>.cc</code>, <code>.ned</code>,{" "}
          <code>omnetpp.ini</code> and <code>eb_helpers.h</code> — to a folder you
          choose (Chrome/Edge) or as a downloaded zip (other browsers).
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

      <button
        onClick={run}
        disabled={busy}
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Working…" : "Pick Event-B folder → Generate"}
      </button>

      <pre className="mt-4 h-64 overflow-auto rounded bg-black p-3 text-green-400">
        {log.length
          ? log.join("\n")
          : "Log output appears here. No Rodin export handy? Try the bundled tests/fixtures/rtmcs folder."}
      </pre>
    </div>
  );
}
