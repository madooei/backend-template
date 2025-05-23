import type { Env } from "hono";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas.ts";

// Define the application-wide Environment type for Hono
export interface AppEnv extends Env {
  Variables: {
    user?: AuthenticatedUserContextType;
    validatedQuery?: unknown;
    validatedBody?: unknown;
    validatedParams?: unknown;
    // You can add other custom c.var properties here if needed elsewhere
  };
  Bindings: Record<string, unknown>;
}
