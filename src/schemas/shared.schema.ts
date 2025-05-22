import { z } from "zod";

// Base Query Parameters Schema
export const queryParamsSchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type QueryParams = z.infer<typeof queryParamsSchema>;
