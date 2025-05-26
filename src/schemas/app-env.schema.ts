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

// How to use this in a Hono app:
//
// const app = new Hono<AppEnv>();
// app.get("/", (c) => {
//   const user = c.var.user; // This will be of type AuthenticatedUserContextType
//   return c.json({ message: `Hello, ${user?.userId || "guest"}!` });
// });
//
// This allows you to define the structure of your application environment,
// including any variables you want to store in the context (c.var) and any bindings
// you might need for your application (like database connections, etc.).
// This schema can be extended with more properties as needed for your application.
