import JSZip from "jszip";
import type { GeneratedTree } from "../engine/types";

// The File System Access API (showDirectoryPicker / createWritable) is not in
// the standard TypeScript DOM lib, so the minimal surface used here is declared
// locally. Runtime behavior is the browser-native API.
interface FsWritable {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}
interface FsFileHandle {
  kind: "file";
  getFile(): Promise<File>;
  createWritable(): Promise<FsWritable>;
}
interface FsDirHandle {
  kind: "directory";
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FsFileHandle>;
  entries(): AsyncIterableIterator<[string, FsFileHandle | FsDirHandle]>;
}
type ShowDirectoryPicker = (options?: { mode?: "read" | "readwrite" }) => Promise<FsDirHandle>;

// Truthy feature-detect rather than `"showDirectoryPicker" in window`: a stub or
// polyfill that sets the property to undefined must still fall back, not throw.
const fsWindow = window as unknown as { showDirectoryPicker?: ShowDirectoryPicker };

export async function readFolder(): Promise<{ name: string; xml: string }[]> {
  // Chrome/Edge: native directory picker. Everything else (Firefox, Safari,
  // mobile) has no showDirectoryPicker, so fall back to a hidden
  // <input webkitdirectory> — same feature-detect shape writeTree uses.
  if (fsWindow.showDirectoryPicker) {
    const dir = await fsWindow.showDirectoryPicker();
    const files: { name: string; xml: string }[] = [];
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind === "file" && /\.(bum|buc)$/.test(name)) {
        const file = await handle.getFile();
        files.push({ name, xml: await file.text() });
      }
    }
    return files;
  }
  return readFolderViaInput();
}

// Fallback for browsers without the File System Access API. webkitdirectory
// yields a flat FileList of the chosen folder's contents; keep only .bum/.buc
// and map each to {name (basename), xml (text)} — the same shape the
// showDirectoryPicker path returns.
function readFolderViaInput(): Promise<{ name: string; xml: string }[]> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    // webkitdirectory is non-standard and absent from the input lib types.
    (input as HTMLInputElement & { webkitdirectory: boolean }).webkitdirectory = true;
    input.oncancel = () => resolve([]);
    input.onchange = async () => {
      try {
        const picked = Array.from(input.files ?? []).filter((f) =>
          /\.(bum|buc)$/.test(f.name),
        );
        resolve(
          await Promise.all(
            picked.map(async (f) => ({ name: f.name, xml: await f.text() })),
          ),
        );
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}

// Read a zipped Rodin project (the "Pick .zip" button or a drag-and-drop). Pull
// every .bum/.buc entry from anywhere in the archive and return the same
// {name (basename), xml} shape as readFolder, so the pipeline downstream is
// identical regardless of whether the input was a folder or a zip.
export async function readZip(file: Blob): Promise<{ name: string; xml: string }[]> {
  const zip = await JSZip.loadAsync(file);
  const files: { name: string; xml: string }[] = [];
  for (const entry of Object.values(zip.files)) {
    if (!entry.dir && /\.(bum|buc)$/i.test(entry.name)) {
      const base = entry.name.slice(entry.name.lastIndexOf("/") + 1);
      files.push({ name: base, xml: await entry.async("string") });
    }
  }
  return files;
}

export async function writeTree(tree: GeneratedTree): Promise<"folder" | "zip"> {
  if (fsWindow.showDirectoryPicker) {
    const dir = await fsWindow.showDirectoryPicker({ mode: "readwrite" });
    for (const f of tree) {
      const handle = await dir.getFileHandle(f.path, { create: true });
      const w = await handle.createWritable();
      await w.write(f.content);
      await w.close();
    }
    return "folder";
  }
  const zip = new JSZip();
  for (const f of tree) zip.file(f.path, f.content);
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "generated-cpp.zip";
  a.click();
  URL.revokeObjectURL(url);
  return "zip";
}
