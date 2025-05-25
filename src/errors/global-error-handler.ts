import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { NotFoundError } from "./not-found.error.ts";
import { UnauthenticatedError } from "./unauthenticated.error.ts";
import { UnauthorizedError } from "./unauthorized.error.ts";
import { ServiceUnavailableError } from "./service-unavailable.error.ts";
import { BadRequestError } from "./bad-request.error.ts";
import type { AppEnv } from "@/schemas/app-env.schema.ts";

export const globalErrorHandler = (err: Error, c: Context<AppEnv>) => {
  console.error(err);
  if (err instanceof HTTPException) {
    return c.json({ error: err.message, cause: err.cause }, err.status);
  } else if (err instanceof NotFoundError) {
    return c.json({ error: err.message }, 404);
  } else if (err instanceof UnauthenticatedError) {
    return c.json({ error: err.message }, 401);
  } else if (err instanceof UnauthorizedError) {
    return c.json({ error: err.message }, 403);
  } else if (err instanceof ServiceUnavailableError) {
    return c.json({ error: err.message }, 503);
  } else if (err instanceof BadRequestError) {
    return c.json({ error: err.message }, 400);
  } else {
    return c.json({ error: "Internal Server Error" }, 500);
  }
};
