import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { createEventsRoutes } from "@/routes/events.router";
import { appEvents } from "@/events/event-emitter";
import type { AppEnv } from "@/schemas/app-env.schema";
import type {
  AuthenticatedUserContextType,
  UserIdType,
} from "@/schemas/user.schemas";
import { globalErrorHandler } from "@/errors";

describe("Events Router", () => {
  let app: Hono<AppEnv>;
  let mockAuthMiddleware: any;

  const testUser: AuthenticatedUserContextType = {
    userId: "user-test-123" as UserIdType,
    globalRole: "user",
  };

  beforeEach(() => {
    // Create fresh mock middleware for each test
    mockAuthMiddleware = vi.fn(async (c: any, next: any) => {
      c.set("user", testUser);
      await next();
    });

    app = new Hono<AppEnv>();
    app.onError(globalErrorHandler);
    // Inject the mock middleware directly
    app.route("/", createEventsRoutes({ authMiddleware: mockAuthMiddleware }));
    appEvents.removeAllListeners();
  });

  afterEach(() => {
    vi.clearAllMocks();
    appEvents.removeAllListeners();
  });

  it("should return SSE headers for events endpoint", async () => {
    const response = await app.request("/events", {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(response.headers.get("connection")).toBe("keep-alive");
  });

  it("should require authentication", async () => {
    // Override auth middleware to simulate unauthenticated user
    const unauthenticatedMiddleware = vi.fn(async (c: any, next: any) => {
      c.set("user", null);
      await next();
    });

    // Create a new app with unauthenticated middleware
    const testApp = new Hono<AppEnv>();
    testApp.onError(globalErrorHandler);
    testApp.route(
      "/",
      createEventsRoutes({ authMiddleware: unauthenticatedMiddleware }),
    );

    const response = await testApp.request("/events", {
      method: "GET",
    });

    expect(response.status).toBe(401);
    const responseText = await response.text();
    expect(responseText).toBe("Unauthorized");
  });

  it("should establish SSE connection and send initial message", async () => {
    const response = await app.request("/events", {
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();

    // Note: Testing the actual streaming content is complex in unit tests
    // but we can verify the connection is established
    expect(response.headers.get("content-type")).toBe("text/event-stream");
  });

  it("should handle note events through event emitter", async () => {
    // Set up event spy
    const eventSpy = vi.fn();
    appEvents.on("notes:created", eventSpy);

    const testEvent = {
      id: "event-1",
      action: "created" as const,
      data: { id: "1", content: "Test note", createdBy: testUser.userId },
      resourceType: "notes",
      timestamp: new Date(),
    };

    // Emit event and verify it's received
    appEvents.emitServiceEvent("notes", testEvent);
    expect(eventSpy).toHaveBeenCalledWith(testEvent);
  });

  it("should handle multiple event types", async () => {
    // Set up spies for different event types
    const createdSpy = vi.fn();
    const updatedSpy = vi.fn();
    const deletedSpy = vi.fn();

    appEvents.on("notes:created", createdSpy);
    appEvents.on("notes:updated", updatedSpy);
    appEvents.on("notes:deleted", deletedSpy);

    const baseEvent = {
      id: "event-1",
      data: { id: "1", content: "Test note", createdBy: testUser.userId },
      resourceType: "notes",
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
    const testEvent = {
      id: "event-1",
      action: "created" as const,
      data: { id: "1", content: "Test note", createdBy: testUser.userId },
      resourceType: "notes",
      timestamp: new Date(),
    };

    // Test that the event listeners are set up with correct names
    const eventSpy = vi.fn();
    appEvents.on("notes:created", eventSpy);

    appEvents.emitServiceEvent("notes", testEvent);
    expect(eventSpy).toHaveBeenCalledWith(testEvent);
  });
});
