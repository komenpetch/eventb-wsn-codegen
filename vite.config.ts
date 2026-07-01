import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/wsn-codegen/", // GitHub Pages project path (repo name)
  plugins: [react()],
  test: {
    environment: "node",      // engine is pure; node is fastest
    include: ["tests/**/*.test.ts"],
  },
});
