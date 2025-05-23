import { z } from "zod";

// Base Query Parameters Schema
export const queryParamsSchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type QueryParamsType = z.infer<typeof queryParamsSchema>;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;

// Schema for paginated results
export const paginatedResultsSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive().default(DEFAULT_PAGE),
    limit: z.number().int().positive().default(DEFAULT_LIMIT),
    totalPages: z.number().int().nonnegative(),
  });

export type PaginatedResultType<T> = z.infer<
  ReturnType<typeof paginatedResultsSchema<z.ZodTypeAny>>
> & { data: T[] }; // Generic data type

// Schema for validating a single string ID from path parameters
export const entityIdParamSchema = (paramName: string) =>
  z.object({
    [paramName]: z.string().min(1, { message: `${paramName} cannot be empty` }),
  });

export type EntityIdParamType = z.infer<ReturnType<typeof entityIdParamSchema>>;
