import { useState } from "react";
import { generate } from "./engine/pipeline";
import { readFolder, writeTree } from "./io/fileOutput";

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const append = (s: string) => setLog((l) => [...l, s]);

  async function run() {
    try {
      append("Selecting Event-B folder…");
      const files = await readFolder();
      append(`Read ${files.length} files. Generating…`);
      const tree = generate(files);
      append(`Generated ${tree.length} files. Choose output folder…`);
      const mode = await writeTree(tree);
      append(mode === "folder" ? "Written to folder." : "Downloaded zip.");
    } catch (e) {
      append(`Error: ${(e as Error).message}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-mono">
      <h1 className="text-xl font-bold mb-4 text-gray-900">eventb-wsn-codegen</h1>
      <button onClick={run} className="px-4 py-2 bg-blue-600 text-white rounded">
        Pick Event-B folder → Generate
      </button>
      <pre className="mt-4 p-3 bg-black text-green-400 rounded h-64 overflow-auto">
        {log.join("\n")}
      </pre>
    </div>
  );
}
