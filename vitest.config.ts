import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      all: true,
      include: ["src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/coverage/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/scripts/**",
        "**/src/server.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
