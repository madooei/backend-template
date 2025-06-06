import { describe, it, expect } from "vitest";
import { serviceEventSchema, noteEventSchema } from "@/schemas/event.schema";

describe("Event Schemas", () => {
  describe("serviceEventSchema", () => {
    it("should validate a complete service event", () => {
      const validEvent = {
        action: "created",
        data: { id: "1", content: "Test note" },
        id: "1",
        user: { id: "user1", name: "John Doe" },
        visibility: "public",
        ownerId: "owner1",
        timestamp: new Date(),
      };

      const result = serviceEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validEvent);
      }
    });

    it("should validate minimal service event", () => {
      const minimalEvent = {
        action: "updated",
        data: { message: "Simple update" },
        timestamp: new Date(),
      };

      const result = serviceEventSchema.safeParse(minimalEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(minimalEvent);
      }
    });

    it("should validate all action types", () => {
      const baseEvent = {
        data: { id: "1" },
        timestamp: new Date(),
      };

      const actions = ["created", "updated", "deleted"] as const;

      actions.forEach((action) => {
        const event = { ...baseEvent, action };
        const result = serviceEventSchema.safeParse(event);
        expect(result.success).toBe(true);
      });
    });

    it("should validate all visibility types", () => {
      const baseEvent = {
        action: "created",
        data: { id: "1" },
        timestamp: new Date(),
      };

      const visibilities = ["public", "private", "team"] as const;

      visibilities.forEach((visibility) => {
        const event = { ...baseEvent, visibility };
        const result = serviceEventSchema.safeParse(event);
        expect(result.success).toBe(true);
      });
    });

    it("should accept string or number id", () => {
      const baseEvent = {
        action: "created",
        data: { content: "test" },
        timestamp: new Date(),
      };

      // Test string id
      const stringIdEvent = { ...baseEvent, id: "string-id" };
      expect(serviceEventSchema.safeParse(stringIdEvent).success).toBe(true);

      // Test number id
      const numberIdEvent = { ...baseEvent, id: 123 };
      expect(serviceEventSchema.safeParse(numberIdEvent).success).toBe(true);
    });

    it("should allow user object with additional properties", () => {
      const event = {
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

    it("should reject invalid visibility", () => {
      const invalidEvent = {
        action: "created",
        data: { id: "1" },
        visibility: "invalid-visibility",
        timestamp: new Date(),
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
        action: "created",
        data: {
          id: "note1",
          content: "This is a test note",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        id: "note1",
        user: { id: "user1" },
        visibility: "public",
        timestamp: new Date(),
      };

      const result = noteEventSchema.safeParse(validNoteEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validNoteEvent);
      }
    });

    it("should validate minimal note event", () => {
      const minimalNoteEvent = {
        action: "updated",
        data: {
          id: "note1",
          content: "Updated content",
        },
        timestamp: new Date(),
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
        action: "created",
        data: {
          id: "note1",
          content: "Test content",
        },
        timestamp: new Date(),
      };

      const eventWithDates = {
        action: "created",
        data: {
          id: "note1",
          content: "Test content",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        timestamp: new Date(),
      };

      expect(noteEventSchema.safeParse(eventWithoutDates).success).toBe(true);
      expect(noteEventSchema.safeParse(eventWithDates).success).toBe(true);
    });
  });
});
