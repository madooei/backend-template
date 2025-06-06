import { z } from "zod";

export const serviceEventSchema = z.object({
  action: z.enum(["created", "updated", "deleted"]),
  data: z.unknown(), // Will be typed based on specific entity
  id: z.union([z.string(), z.number()]).optional(),
  user: z
    .object({
      id: z.string(),
    })
    .passthrough()
    .optional(),
  visibility: z.enum(["public", "private", "team"]).optional(),
  ownerId: z.string().optional(),
  timestamp: z.date(),
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
