import { describe, it, expect, vi, beforeEach } from "vitest";
import { appEvents } from "@/events/event-emitter";
import type { ServiceEvent } from "@/events/event-emitter";

describe("AppEventEmitter", () => {
  beforeEach(() => {
    // Clear all listeners before each test
    appEvents.removeAllListeners();
  });

  it("should emit service events with correct format", () => {
    const eventHandler = vi.fn();
    appEvents.on("notes:created", eventHandler);

    const testEvent: ServiceEvent = {
      action: "created",
      data: { id: "1", content: "Test note" },
      id: "1",
      user: { id: "user1" },
      visibility: "public",
      timestamp: new Date(),
    };

    appEvents.emitServiceEvent("notes", testEvent);

    expect(eventHandler).toHaveBeenCalledWith(testEvent);
  });

  it("should emit events for different actions", () => {
    const createdHandler = vi.fn();
    const updatedHandler = vi.fn();
    const deletedHandler = vi.fn();

    appEvents.on("notes:created", createdHandler);
    appEvents.on("notes:updated", updatedHandler);
    appEvents.on("notes:deleted", deletedHandler);

    const baseEvent = {
      data: { id: "1", content: "Test note" },
      id: "1",
      user: { id: "user1" },
      visibility: "public" as const,
      timestamp: new Date(),
    };

    appEvents.emitServiceEvent("notes", { ...baseEvent, action: "created" });
    appEvents.emitServiceEvent("notes", { ...baseEvent, action: "updated" });
    appEvents.emitServiceEvent("notes", { ...baseEvent, action: "deleted" });

    expect(createdHandler).toHaveBeenCalledTimes(1);
    expect(updatedHandler).toHaveBeenCalledTimes(1);
    expect(deletedHandler).toHaveBeenCalledTimes(1);
  });

  it("should support multiple listeners for the same event", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    appEvents.on("notes:created", handler1);
    appEvents.on("notes:created", handler2);

    const testEvent: ServiceEvent = {
      action: "created",
      data: { id: "1", content: "Test note" },
      timestamp: new Date(),
    };

    appEvents.emitServiceEvent("notes", testEvent);

    expect(handler1).toHaveBeenCalledWith(testEvent);
    expect(handler2).toHaveBeenCalledWith(testEvent);
  });

  it("should allow removing event listeners", () => {
    const eventHandler = vi.fn();
    appEvents.on("notes:created", eventHandler);

    const testEvent: ServiceEvent = {
      action: "created",
      data: { id: "1", content: "Test note" },
      timestamp: new Date(),
    };

    appEvents.emitServiceEvent("notes", testEvent);
    expect(eventHandler).toHaveBeenCalledTimes(1);

    appEvents.off("notes:created", eventHandler);
    appEvents.emitServiceEvent("notes", testEvent);
    expect(eventHandler).toHaveBeenCalledTimes(1); // Should not be called again
  });

  it("should handle events with minimal data", () => {
    const eventHandler = vi.fn();
    appEvents.on("notes:created", eventHandler);

    const minimalEvent: ServiceEvent = {
      action: "created",
      data: { id: "1", content: "Test note" },
      timestamp: new Date(),
    };

    appEvents.emitServiceEvent("notes", minimalEvent);

    expect(eventHandler).toHaveBeenCalledWith(minimalEvent);
  });
});
