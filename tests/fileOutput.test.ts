// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { writeTree } from "../src/io/fileOutput";

// writeTree has two output paths the user can hit depending on the browser:
// the File System Access folder write (Chrome/Edge) and the zip download
// fallback (Firefox/Safari/mobile). Exercise both against the real function,
// stubbing only the browser-native showDirectoryPicker boundary.

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
