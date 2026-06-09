import JSZip from "jszip";
import type { VirtualFileTree } from "../engine/types";

// The File System Access API (showDirectoryPicker / createWritable) is not in
// the standard TypeScript DOM lib, so it is reached through a narrow `any` view
// of `window`. Runtime behavior is the browser-native API; the casts only quiet
// the type checker for the non-standard surface.

export async function readFolder(): Promise<{ name: string; xml: string }[]> {
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
