import { defineConfig } from "tsup";

export default defineConfig({
  target: "node20",
  entry: ["src/server.ts"],
  outDir: "dist",
  format: ["esm"],
  sourcemap: true,
  clean: true,
  dts: true,
  splitting: true,
  treeshake: true,
  esbuildOptions(options) {
    options.alias = {
      "@": "./src",
    };
  },
});
