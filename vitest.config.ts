import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Global setup and teardown for MongoDB
    globalSetup: ["./tests/config/mongodb.global.ts"],
    // Per-test setup
    setupFiles: ["./tests/config/mongodb.setup.ts"],
    // Ensure tests run serially to avoid database conflicts
    pool: "forks",
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
        "**/src/config/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
