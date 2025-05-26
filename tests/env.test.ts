import { describe, it, expect } from "vitest";
import { z } from "zod";

// Re-define the envSchema as in src/env.ts for isolated testing
const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),
  AUTH_SERVICE_URL: z.string().url().optional(),
});

describe("envSchema", () => {
  it("accepts valid env object", () => {
    const valid = {
      NODE_ENV: "production",
      PORT: 8080,
      AUTH_SERVICE_URL: "http://localhost:4000",
    };
    expect(envSchema.parse(valid)).toEqual(valid);
  });
  it("coerces PORT to number", () => {
    const parsed = envSchema.parse({ NODE_ENV: "test", PORT: "1234" });
    expect(parsed.PORT).toBe(1234);
  });
  it("defaults NODE_ENV and PORT if missing", () => {
    const parsed = envSchema.parse({});
    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.PORT).toBe(3000);
  });
  it("accepts missing AUTH_SERVICE_URL", () => {
    const parsed = envSchema.parse({ NODE_ENV: "dev", PORT: 3000 });
    expect(parsed.AUTH_SERVICE_URL).toBeUndefined();
  });
  it("rejects invalid AUTH_SERVICE_URL", () => {
    expect(() => envSchema.parse({ AUTH_SERVICE_URL: "not-a-url" })).toThrow();
  });
  it("rejects non-string NODE_ENV", () => {
    expect(() => envSchema.parse({ NODE_ENV: 123 })).toThrow();
  });
});
