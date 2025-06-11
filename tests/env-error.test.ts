import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

describe("env error handling", () => {
  // Mock console.error and process.exit
  const consoleErrorMock = vi
    .spyOn(console, "error")
    .mockImplementation(() => {});
  const processExitMock = vi
    .spyOn(process, "exit")
    .mockImplementation((code) => {
      return code as never; // TypeScript expects this function to never return
    });

  // Create a backup of process.env and restore it after each test
  let envBackup: NodeJS.ProcessEnv;

  beforeEach(() => {
    envBackup = { ...process.env };

    // Clear mocks before each test
    consoleErrorMock.mockClear();
    processExitMock.mockClear();
  });

  afterEach(() => {
    // Restore the original process.env
    process.env = envBackup;
  });

  it("should exit with code 1 when environment variables are invalid", async () => {
    // Reset potential cached module
    vi.resetModules();

    // Set an invalid value for AUTH_SERVICE_URL
    process.env.AUTH_SERVICE_URL = "not-a-valid-url";

    // Import env.ts - this will trigger the validation logic
    // We need to use dynamic import to avoid the validation running at module load time
    try {
      await import("../src/env");
    } catch (error) {
      // If it throws, that's expected since process.exit is mocked
    }

    // Verify console.error was called twice
    expect(consoleErrorMock).toHaveBeenCalledTimes(2);
    expect(consoleErrorMock.mock.calls[0][0]).toBe(
      "❌ Invalid environment variables after mapping:"
    );
    expect(consoleErrorMock.mock.calls[1][0]).toBe(
      "Mapped environment data passed to Zod:"
    );

    // Verify process.exit was called with code 1
    expect(processExitMock).toHaveBeenCalledWith(1);
  });
});
