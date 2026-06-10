// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import JSZip from "jszip";
import { writeTree, readZip } from "../src/io/fileOutput";

// writeTree has two output paths the user can hit depending on the browser:
// the File System Access folder write (Chrome/Edge) and the zip download
// fallback (Firefox/Safari/mobile). readZip is the symmetric input path: read
// a Rodin project that has been zipped. Exercise all of them against the real
// functions, stubbing only the browser-native showDirectoryPicker boundary.

interface PickerWindow {
  showDirectoryPicker?: unknown;
}

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as unknown as PickerWindow).showDirectoryPicker;
});

describe("writeTree output paths", () => {
  it("writes each file through the directory handle when the picker exists", async () => {
    const written: Record<string, string> = {};
    const fakeDir = {
      getFileHandle: async (name: string) => ({
        createWritable: async () => ({
          write: async (data: string) => {
            written[name] = data;
          },
          close: async () => {},
        }),
      }),
    };
    (window as unknown as PickerWindow).showDirectoryPicker = vi.fn(async () => fakeDir);

    const mode = await writeTree([
      { path: "RTMCS.h", content: "H" },
      { path: "RTMCS.cc", content: "CC" },
    ]);

    expect(mode).toBe("folder");
    expect(written).toEqual({ "RTMCS.h": "H", "RTMCS.cc": "CC" });
  });

  it("falls back to a single zip download when showDirectoryPicker is absent", async () => {
    // Simulate a browser without the File System Access API.
    (window as unknown as PickerWindow).showDirectoryPicker = undefined;
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn(() => "blob:fake");
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn();

    const downloads: string[] = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === "a") {
        vi.spyOn(el as HTMLAnchorElement, "click").mockImplementation(() => {
          downloads.push((el as HTMLAnchorElement).download);
        });
      }
      return el;
    });

    const mode = await writeTree([{ path: "RTMCS.h", content: "// scaffold" }]);

    expect(mode).toBe("zip");
    expect(downloads).toEqual(["generated-cpp.zip"]);
  });
});

describe("readZip input path", () => {
  async function makeZip(entries: Record<string, string>): Promise<File> {
    const zip = new JSZip();
    for (const [path, content] of Object.entries(entries)) zip.file(path, content);
    const buf = await zip.generateAsync({ type: "arraybuffer" });
    return new File([buf], "project.zip", { type: "application/zip" });
  }

  it("extracts .bum/.buc entries (recursively) and ignores other files", async () => {
    const file = await makeZip({
      "WBAN/M0.bum": "<machine0/>",
      "WBAN/C0.buc": "<context0/>",
      "WBAN/notes.txt": "ignore me",
      "README.md": "ignore me too",
    });

    const files = await readZip(file);

    expect(files).toEqual(
      expect.arrayContaining([
        { name: "M0.bum", xml: "<machine0/>" },
        { name: "C0.buc", xml: "<context0/>" },
      ]),
    );
    expect(files).toHaveLength(2);
    expect(files.some((f) => f.name.endsWith(".txt") || f.name.endsWith(".md"))).toBe(false);
  });

  it("returns no files for a zip with no Event-B models", async () => {
    const file = await makeZip({ "docs/readme.txt": "nothing here" });
    expect(await readZip(file)).toEqual([]);
  });
});
