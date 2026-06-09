import JSZip from "jszip";
import type { VirtualFileTree } from "../engine/types";

// The File System Access API (showDirectoryPicker / createWritable) is not in
// the standard TypeScript DOM lib, so it is reached through a narrow `any` view
// of `window`. Runtime behavior is the browser-native API; the casts only quiet
// the type checker for the non-standard surface.

export async function readFolder(): Promise<{ name: string; xml: string }[]> {
  // Chrome/Edge: native directory picker. Everything else (Firefox, Safari,
  // mobile) has no showDirectoryPicker, so fall back to a hidden
  // <input webkitdirectory> — same feature-detect shape writeTree uses.
  if ("showDirectoryPicker" in window) {
    const dir: any = await (window as any).showDirectoryPicker();
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
    (input as any).webkitdirectory = true;
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

export async function writeTree(tree: VirtualFileTree): Promise<"folder" | "zip"> {
  if ("showDirectoryPicker" in window) {
    const dir: any = await (window as any).showDirectoryPicker({ mode: "readwrite" });
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
