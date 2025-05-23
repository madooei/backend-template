import type { Env } from "hono";

// Define the application-wide Environment type for Hono
export interface AppEnv extends Env {
  Variables: {
    validatedQuery?: unknown;
    validatedBody?: unknown;
    validatedParams?: unknown;
    // You can add other custom c.var properties here if needed elsewhere
  };
  Bindings: Record<string, unknown>;
}
