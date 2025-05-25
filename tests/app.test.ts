import { describe, it, expect } from "vitest";
import { app } from "@/app.ts";

// Tests specific to each route (e.g., `/notes`) are in the corresponding
// router test file (e.g., `routes/note.router.test.ts`).
// This file tests the routes explicitly defined in the `src/app.ts` file.

describe("App integration", () => {
  it("responds to GET /", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Hello Hono!");
  });

  it("responds to GET /health", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("returns 404 for unknown route", async () => {
    const res = await app.request("/not-found");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not Found" });
  });
});
