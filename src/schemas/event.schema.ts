import { z } from "zod";

export const serviceEventSchema = z.object({
  id: z.string(), // Event's own ID for storage/audit
  action: z.enum(["created", "updated", "deleted"]),
  data: z.unknown(), // Will be typed based on specific entity
  user: z
    .object({
      id: z.string(),
    })
    .passthrough()
    .optional(), // Optional for system events
  timestamp: z.date(), // When event occurred
  resourceType: z.string(), // 'notes', 'users', 'projects', etc.
});

export type ServiceEventType = z.infer<typeof serviceEventSchema>;

// Specific event types
export const noteEventSchema = serviceEventSchema.extend({
  data: z.object({
    id: z.string(),
    content: z.string(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  }),
});

export type NoteEventType = z.infer<typeof noteEventSchema>;
