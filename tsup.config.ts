import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  sourcemap: true,
  clean: true,
  dts: true,
  treeshake: true,
  outDir: "dist",
  target: "node16",

  // This is the key part for path aliases
  esbuildOptions(options) {
    options.alias = {
      "@": "./src",
    };
  },
});
