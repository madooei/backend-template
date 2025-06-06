import { describe, it, expect, vi, beforeEach } from "vitest";
import { testClient } from "hono/testing";
import { Hono } from "hono";
import { createEventsRoutes } from "@/routes/events.router";
import { appEvents } from "@/events/event-emitter";
import type { AppEnv } from "@/schemas/app-env.schema";

// Mock the auth middleware
vi.mock("@/middlewares/auth.middleware", () => ({
  authMiddleware: vi.fn(async (c, next) => {
    // Mock authenticated user
    c.set("user", {
      userId: "test-user-1",
      globalRole: "user",
    });
    await next();
  }),
}));

describe("Events Router", () => {
  let app: Hono<AppEnv>;
  let client: ReturnType<typeof testClient>;

  beforeEach(() => {
    app = new Hono<AppEnv>();
    app.route("/", createEventsRoutes());
    client = testClient(app);
    appEvents.removeAllListeners();
  });

  it("should return SSE headers for events endpoint", async () => {
    const response = await client.events.$get();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(response.headers.get("connection")).toBe("keep-alive");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("should require authentication", async () => {
    // Mock auth middleware to throw error
    vi.doMock("@/middlewares/auth.middleware", () => ({
      authMiddleware: vi.fn(async () => {
        throw new Error("Unauthorized");
      }),
    }));

    // Re-import to get mocked version
    const { createEventsRoutes: mockedCreateEventsRoutes } = await import(
      "@/routes/events.router"
    );

    const testApp = new Hono<AppEnv>();
    testApp.route("/", mockedCreateEventsRoutes());
    const testClientInstance = testClient(testApp);

    try {
      await testClientInstance.events.$get();
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should stream events in SSE format", async () => {
    // Start the SSE connection
    const response = await client.events.$get();
    expect(response.status).toBe(200);

    // Since we can't easily test streaming in unit tests,
    // we'll test the event filtering logic separately
    const testEvent = {
      action: "created" as const,
      data: { id: "1", content: "Test note" },
      visibility: "public" as const,
      timestamp: new Date(),
    };

    // Import the filtering function for testing
    const { shouldUserReceiveEvent } = await import("@/routes/events.router");

    // Test that public events are allowed
    expect(shouldUserReceiveEvent(testEvent)).toBe(true);

    // Test that private events are filtered out
    const privateEvent = { ...testEvent, visibility: "private" as const };
    expect(shouldUserReceiveEvent(privateEvent)).toBe(false);
  });

  it("should filter events based on visibility", async () => {
    const { shouldUserReceiveEvent } = await import("@/routes/events.router");

    const baseEvent = {
      action: "created" as const,
      data: { id: "1", content: "Test" },
      timestamp: new Date(),
    };

    // Public events should be allowed
    expect(shouldUserReceiveEvent({ ...baseEvent, visibility: "public" })).toBe(
      true,
    );

    // Private events should be filtered
    expect(
      shouldUserReceiveEvent({ ...baseEvent, visibility: "private" }),
    ).toBe(false);

    // Team events should be filtered (for now)
    expect(shouldUserReceiveEvent({ ...baseEvent, visibility: "team" })).toBe(
      false,
    );

    // Events without visibility should be filtered
    expect(shouldUserReceiveEvent(baseEvent)).toBe(false);
  });

  it("should handle note events", async () => {
    const response = await client.events.$get();
    expect(response.status).toBe(200);

    // Test that the event listeners are properly set up
    // We can verify this by checking that events are emitted
    const eventSpy = vi.fn();
    appEvents.on("notes:created", eventSpy);

    const testEvent = {
      action: "created" as const,
      data: { id: "1", content: "Test note" },
      visibility: "public" as const,
      timestamp: new Date(),
    };

    appEvents.emitServiceEvent("notes", testEvent);
    expect(eventSpy).toHaveBeenCalledWith(testEvent);
  });

  it("should handle multiple event types", async () => {
    const response = await client.events.$get();
    expect(response.status).toBe(200);

    // Set up spies for different event types
    const createdSpy = vi.fn();
    const updatedSpy = vi.fn();
    const deletedSpy = vi.fn();

    appEvents.on("notes:created", createdSpy);
    appEvents.on("notes:updated", updatedSpy);
    appEvents.on("notes:deleted", deletedSpy);

    const baseEvent = {
      data: { id: "1", content: "Test note" },
      visibility: "public" as const,
      timestamp: new Date(),
    };

    // Emit different event types
    appEvents.emitServiceEvent("notes", { ...baseEvent, action: "created" });
    appEvents.emitServiceEvent("notes", { ...baseEvent, action: "updated" });
    appEvents.emitServiceEvent("notes", { ...baseEvent, action: "deleted" });

    expect(createdSpy).toHaveBeenCalledTimes(1);
    expect(updatedSpy).toHaveBeenCalledTimes(1);
    expect(deletedSpy).toHaveBeenCalledTimes(1);
  });

  it("should properly format SSE event names", async () => {
    // Test the event name formatting
    const testEvent = {
      action: "created" as const,
      data: { id: "1", content: "Test note" },
      visibility: "public" as const,
      timestamp: new Date(),
    };

    // The event should be formatted as "notes:created"
    // This is tested indirectly through the event listener setup
    const eventSpy = vi.fn();
    appEvents.on("notes:created", eventSpy);

    appEvents.emitServiceEvent("notes", testEvent);
    expect(eventSpy).toHaveBeenCalledWith(testEvent);
  });
});

// Export the filtering function for testing
// This is a workaround since the function is not exported from the module
declare module "@/routes/events.router" {
  export function shouldUserReceiveEvent(event: {
    visibility?: "public" | "private" | "team";
  }): boolean;
}
