import { describe, it, expect } from "vitest";
import { z } from "zod";

// Re-define the envSchema as in src/env.ts for isolated testing
const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),
  // External authentication service
  AUTH_SERVICE_URL: z.string().url().optional(),
  // MongoDB URI Configuration
  MONGODB_HOST: z.string().default("localhost"),
  MONGODB_PORT: z.coerce.number().default(27017),
  MONGODB_USER: z.string().optional(),
  MONGODB_PASSWORD: z.string().optional(),
  MONGODB_DATABASE: z.string().default("backend-template"),
});

describe("envSchema", () => {
  it("accepts valid env object", () => {
    const valid = {
      NODE_ENV: "production",
      PORT: 8080,
      AUTH_SERVICE_URL: "http://localhost:4000",
      MONGODB_HOST: "mongodb.example.com",
      MONGODB_PORT: 27017,
      MONGODB_USER: "testuser",
      MONGODB_PASSWORD: "testpass",
      MONGODB_DATABASE: "testdb",
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

  // MongoDB tests
  it("defaults MongoDB host, port and database if missing", () => {
    const parsed = envSchema.parse({});
    expect(parsed.MONGODB_HOST).toBe("localhost");
    expect(parsed.MONGODB_PORT).toBe(27017);
    expect(parsed.MONGODB_DATABASE).toBe("backend-template");
  });

  it("coerces MONGODB_PORT to number", () => {
    const parsed = envSchema.parse({ MONGODB_PORT: "8888" });
    expect(parsed.MONGODB_PORT).toBe(8888);
  });

  it("accepts MongoDB credentials when provided", () => {
    const valid = {
      MONGODB_USER: "testuser",
      MONGODB_PASSWORD: "testpass",
    };
    const parsed = envSchema.parse(valid);
    expect(parsed.MONGODB_USER).toBe("testuser");
    expect(parsed.MONGODB_PASSWORD).toBe("testpass");
  });

  it("accepts missing MongoDB credentials", () => {
    const parsed = envSchema.parse({});
    expect(parsed.MONGODB_USER).toBeUndefined();
    expect(parsed.MONGODB_PASSWORD).toBeUndefined();
  });

  it("accepts custom MongoDB configuration", () => {
    const valid = {
      MONGODB_HOST: "mongodb.example.com",
      MONGODB_PORT: 27018,
      MONGODB_DATABASE: "custom-database",
    };
    expect(envSchema.parse(valid)).toMatchObject(valid);
  });
});
