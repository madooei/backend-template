import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { ZodTypeAny } from "zod";
import type { AppEnv } from "@/schemas/app-env.schema.ts";

/**
 * Defines the possible sources from which data can be validated.
 * - 'body': Validates c.req.json()
 * - 'query': Validates c.req.query() (all query parameters)
 * - 'params': Validates c.req.param() (all path parameters)
 */
export type ValidationDataSource = "body" | "query" | "params";

/**
 * Options for the validation middleware.
 */
interface ValidationOptions {
  /** The Zod schema to validate against. */
  schema: ZodTypeAny;
  /** The source of the data to validate. */
  source: ValidationDataSource;
  /** The key under which the validated data will be stored in `c.var`. */
  varKey: string;
}

/**
 * Creates a Hono middleware for validating request data using a Zod schema.
 *
 * @param options - The validation options.
 * @returns A Hono MiddlewareHandler.
 *
 * @example
 * ```typescript
 * // In your Hono app setup (e.g., src/app.ts)
 * import { validate } from '@/middlewares/validation.middleware.ts';
 * import { createNoteSchema, type CreateNoteType } from '@/schemas/note.schema.ts';
 *
 * const app = new Hono();
 *
 * app.post(
 *   '/notes',
 *   validate({ schema: createNoteSchema, source: 'body', varKey: 'validatedBody' }),
 *   (c) => {
 *     const validatedData = c.var.validatedBody as CreateNoteType;
 *     // ... your controller logic using validatedData ...
 *     return c.json({ message: 'Note created', data: validatedData });
 *   }
 * );
 * ```
 */
export const validate = (
  options: ValidationOptions,
): MiddlewareHandler<AppEnv> => {
  const { schema, source, varKey } = options;

  return createMiddleware<AppEnv>(async (c, next) => {
    let dataToValidate: unknown;

    try {
      switch (source) {
        case "body":
          dataToValidate = await c.req.json();
          break;
        case "query":
          // Hono's c.req.query() returns Record<string, string | string[]>
          // Zod schemas for query params usually expect Record<string, string | undefined>
          // We'll pass it as is, Zod coercion should handle it for simple cases.
          // For complex array query params, schema design needs care.
          dataToValidate = c.req.query();
          break;
        case "params":
          dataToValidate = c.req.param(); // Returns Record<string, string>
          break;
        default:
          // Should not happen if types are correct
          console.warn(`ValidationMiddleware: Unknown data source "${source}"`);
          throw new HTTPException(500, {
            message: "Internal server error: Invalid validation configuration.",
          });
      }
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      // Handle errors during data extraction (e.g., invalid JSON in body)
      let message = `Invalid request ${source}.`;
      if (error instanceof Error) {
        message = error.message.includes("body")
          ? "Invalid JSON in request body."
          : `Error reading request ${source}.`;
      }
      throw new HTTPException(400, { message });
    }

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      throw new HTTPException(400, {
        message: `Validation failed for ${source}.`,
        cause: result.error.flatten(),
      });
    }

    c.set(varKey as keyof AppEnv["Variables"], result.data);
    await next();
  });
};
