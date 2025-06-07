import { describe, it, expect } from "vitest";
import { serviceEventSchema, noteEventSchema } from "@/schemas/event.schema";

describe("Event Schemas", () => {
  describe("serviceEventSchema", () => {
    it("should validate a complete service event", () => {
      const validEvent = {
        id: "event-1",
        action: "created",
        data: { id: "1", content: "Test note" },
        user: { id: "user1", name: "John Doe" },
        timestamp: new Date(),
        resourceType: "notes",
      };

      const result = serviceEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validEvent);
      }
    });

    it("should validate minimal service event", () => {
      const minimalEvent = {
        id: "event-2",
        action: "updated",
        data: { message: "Simple update" },
        timestamp: new Date(),
        resourceType: "notes",
      };

      const result = serviceEventSchema.safeParse(minimalEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(minimalEvent);
      }
    });

    it("should validate all action types", () => {
      const baseEvent = {
        id: "event-3",
        data: { id: "1" },
        timestamp: new Date(),
        resourceType: "notes",
      };

      const actions = ["created", "updated", "deleted"] as const;

      actions.forEach((action) => {
        const event = { ...baseEvent, action };
        const result = serviceEventSchema.safeParse(event);
        expect(result.success).toBe(true);
      });
    });

    it("should validate resourceType field", () => {
      const baseEvent = {
        id: "event-4",
        action: "created",
        data: { id: "1" },
        timestamp: new Date(),
      };

      const resourceTypes = ["notes", "users", "projects"] as const;

      resourceTypes.forEach((resourceType) => {
        const event = { ...baseEvent, resourceType };
        const result = serviceEventSchema.safeParse(event);
        expect(result.success).toBe(true);
      });
    });

    it("should accept string id", () => {
      const baseEvent = {
        action: "created",
        data: { content: "test" },
        timestamp: new Date(),
        resourceType: "notes",
      };

      // Test string id
      const stringIdEvent = { ...baseEvent, id: "string-id" };
      expect(serviceEventSchema.safeParse(stringIdEvent).success).toBe(true);
    });

    it("should allow user object with additional properties", () => {
      const event = {
        id: "event-5",
        action: "created",
        data: { id: "1" },
        user: {
          id: "user1",
          name: "John Doe",
          email: "john@example.com",
          roles: ["admin"],
          metadata: { lastLogin: new Date() },
        },
        timestamp: new Date(),
        resourceType: "notes",
      };

      const result = serviceEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it("should reject invalid action", () => {
      const invalidEvent = {
        action: "invalid-action",
        data: { id: "1" },
        timestamp: new Date(),
      };

      const result = serviceEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should require id field", () => {
      const invalidEvent = {
        action: "created",
        data: { id: "1" },
        timestamp: new Date(),
        resourceType: "notes",
        // Missing required id
      };

      const result = serviceEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should require user.id when user is provided", () => {
      const invalidEvent = {
        action: "created",
        data: { id: "1" },
        user: { name: "John Doe" }, // Missing required id
        timestamp: new Date(),
      };

      const result = serviceEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should require timestamp", () => {
      const invalidEvent = {
        action: "created",
        data: { id: "1" },
        // Missing required timestamp
      };

      const result = serviceEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe("noteEventSchema", () => {
    it("should validate a complete note event", () => {
      const validNoteEvent = {
        id: "event-note1",
        action: "created",
        data: {
          id: "note1",
          content: "This is a test note",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: { id: "user1" },
        timestamp: new Date(),
        resourceType: "notes",
      };

      const result = noteEventSchema.safeParse(validNoteEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validNoteEvent);
      }
    });

    it("should validate minimal note event", () => {
      const minimalNoteEvent = {
        id: "event-note2",
        action: "updated",
        data: {
          id: "note1",
          content: "Updated content",
        },
        timestamp: new Date(),
        resourceType: "notes",
      };

      const result = noteEventSchema.safeParse(minimalNoteEvent);
      expect(result.success).toBe(true);
    });

    it("should require note data.id", () => {
      const invalidEvent = {
        action: "created",
        data: {
          content: "Missing id",
        },
        timestamp: new Date(),
      };

      const result = noteEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should require note data.content", () => {
      const invalidEvent = {
        action: "created",
        data: {
          id: "note1",
          // Missing required content
        },
        timestamp: new Date(),
      };

      const result = noteEventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it("should allow optional createdAt and updatedAt", () => {
      const eventWithoutDates = {
        id: "event-note3",
        action: "created",
        data: {
          id: "note1",
          content: "Test content",
        },
        timestamp: new Date(),
        resourceType: "notes",
      };

      const eventWithDates = {
        id: "event-note4",
        action: "created",
        data: {
          id: "note1",
          content: "Test content",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        timestamp: new Date(),
        resourceType: "notes",
      };

      expect(noteEventSchema.safeParse(eventWithoutDates).success).toBe(true);
      expect(noteEventSchema.safeParse(eventWithDates).success).toBe(true);
    });
  });
});
