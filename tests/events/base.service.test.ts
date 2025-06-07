import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseService } from "@/events/base.service";
import { appEvents } from "@/events/event-emitter";

// Create a concrete implementation for testing
class TestService extends BaseService {
  constructor() {
    super("test");
  }

  public testEmitEvent<T>(
    action: "created" | "updated" | "deleted",
    data: T,
    options?: {
      id?: string;
      user?: { userId: string; [key: string]: unknown };
    },
  ) {
    this.emitEvent(action, data, options);
  }
}

describe("BaseService", () => {
  let testService: TestService;

  beforeEach(() => {
    testService = new TestService();
    appEvents.removeAllListeners();
  });

  it("should emit events with service name prefix", () => {
    const eventHandler = vi.fn();
    appEvents.on("test:created", eventHandler);

    const testData = { id: "1", name: "Test Item" };
    testService.testEmitEvent("created", testData);

    expect(eventHandler).toHaveBeenCalledWith({
      id: expect.any(String),
      action: "created",
      data: testData,
      user: undefined,
      timestamp: expect.any(Date),
      resourceType: "test",
    });
  });

  it("should emit events with all optional parameters", () => {
    const eventHandler = vi.fn();
    appEvents.on("test:updated", eventHandler);

    const testData = { id: "1", name: "Updated Item" };
    const options = {
      id: "1",
      user: { userId: "user1", name: "Test User" },
    };

    testService.testEmitEvent("updated", testData, options);

    expect(eventHandler).toHaveBeenCalledWith({
      id: "1",
      action: "updated",
      data: testData,
      user: {
        id: "user1",
        userId: "user1",
        name: "Test User",
      },
      timestamp: expect.any(Date),
      resourceType: "test",
    });
  });

  it("should emit delete events", () => {
    const eventHandler = vi.fn();
    appEvents.on("test:deleted", eventHandler);

    const testData = { id: "1", name: "Deleted Item" };
    testService.testEmitEvent("deleted", testData, { id: "1" });

    expect(eventHandler).toHaveBeenCalledWith({
      id: "1",
      action: "deleted",
      data: testData,
      user: undefined,
      timestamp: expect.any(Date),
      resourceType: "test",
    });
  });

  it("should emit events with minimal data", () => {
    const eventHandler = vi.fn();
    appEvents.on("test:created", eventHandler);

    const testData = { message: "Simple test" };
    testService.testEmitEvent("created", testData);

    expect(eventHandler).toHaveBeenCalledWith({
      id: expect.any(String),
      action: "created",
      data: testData,
      user: undefined,
      timestamp: expect.any(Date),
      resourceType: "test",
    });
  });

  it("should handle complex user objects", () => {
    const eventHandler = vi.fn();
    appEvents.on("test:created", eventHandler);

    const testData = { id: "1", content: "Test content" };
    const complexUser = {
      userId: "user1",
      name: "John Doe",
      email: "john@example.com",
      roles: ["admin", "user"],
      metadata: { lastLogin: new Date() },
    };

    testService.testEmitEvent("created", testData, { user: complexUser });

    expect(eventHandler).toHaveBeenCalledWith({
      id: expect.any(String),
      action: "created",
      data: testData,
      user: {
        id: "user1",
        userId: "user1",
        name: "John Doe",
        email: "john@example.com",
        roles: ["admin", "user"],
        metadata: { lastLogin: expect.any(Date) },
      },
      timestamp: expect.any(Date),
      resourceType: "test",
    });
  });

  it("should generate unique timestamps for each event", async () => {
    const eventHandler = vi.fn();
    appEvents.on("test:created", eventHandler);

    const testData = { id: "1", content: "Test" };

    testService.testEmitEvent("created", testData);
    // Small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 1));
    testService.testEmitEvent("created", testData);

    expect(eventHandler).toHaveBeenCalledTimes(2);
    const firstCall = eventHandler.mock.calls[0][0];
    const secondCall = eventHandler.mock.calls[1][0];

    expect(firstCall.timestamp).not.toEqual(secondCall.timestamp);
  });
});
