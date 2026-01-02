# Middleware Reference

Complete implementation examples for middleware.

## Authentication Middleware

**File**: `src/middlewares/auth.middleware.ts`

```typescript
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "@/schemas/app-env.schema";
import { AuthenticationService } from "@/services/authentication.service";
import { UnauthenticatedError } from "@/errors";

class TokenError extends UnauthenticatedError {
  constructor() {
    super("Authorization header is missing or invalid.");
  }
}

export interface AuthMiddlewareDeps {
  authenticationService: AuthenticationService;
}

// Factory function to create the auth middleware with injectable dependencies
export const createAuthMiddleware = (deps: AuthMiddlewareDeps) => {
  const { authenticationService } = deps;

  return createMiddleware<AppEnv>(async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) throw new TokenError();

    const parts = authHeader.split(" ");
    let token: string | undefined;

    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      token = parts[1];
    }
    if (!token) throw new TokenError();

    // Will throw errors if it cannot authenticate
    const user = await authenticationService.authenticateUserByToken(token);

    c.set("user", user);
    await next();
  });
};

const defaultAuthenticationService = new AuthenticationService();
export const authMiddleware = createAuthMiddleware({
  authenticationService: defaultAuthenticationService,
});
```

## Validation Middleware

**File**: `src/middlewares/validation.middleware.ts`

```typescript
import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { ZodTypeAny } from "zod";
import type { AppEnv } from "@/schemas/app-env.schema";
import { BadRequestError, InternalServerError } from "@/errors";

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
          dataToValidate = c.req.query();
          break;
        case "params":
          dataToValidate = c.req.param();
          break;
        default:
          console.warn(`ValidationMiddleware: Unknown data source "${source}"`);
          throw new InternalServerError();
      }
    } catch (error) {
      if (
        error instanceof HTTPException ||
        error instanceof InternalServerError
      ) {
        throw error;
      }
      let message = `Invalid request ${source}.`;
      if (error instanceof Error) {
        message = error.message.includes("body")
          ? "Invalid JSON in request body."
          : `Error reading request ${source}.`;
      }
      throw new BadRequestError(message);
    }

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const fieldErrorMessages = Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
        .join("; ");
      throw new BadRequestError(
        `Validation failed for ${source}. ${fieldErrorMessages}`,
        { cause: result.error.flatten() },
      );
    }

    c.set(varKey as keyof AppEnv["Variables"], result.data);
    await next();
  });
};
```

## Global Error Handler

**File**: `src/errors.ts` (partial)

```typescript
import type { Context } from "hono";
import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "@/schemas/app-env.schema";

// ... BaseError and specific error classes ...

/**
 * Helper function to create a Hono Response from a BaseError instance.
 */
export function createErrorResponse(c: Context, error: BaseError): Response {
  const errorBody = error.toJSON();
  let statusCode: StatusCode = 500;

  if (
    typeof error.errorCode === "number" &&
    error.errorCode >= 100 &&
    error.errorCode < 600
  ) {
    statusCode = error.errorCode as StatusCode;
  }

  return c.json(errorBody, statusCode as ContentfulStatusCode);
}

export const globalErrorHandler = (err: Error, c: Context<AppEnv>) => {
  console.error(err);

  if (err instanceof BaseError) {
    return createErrorResponse(c, err);
  } else if (err instanceof HTTPException) {
    return c.json({ error: err.message, cause: err.cause }, err.status);
  } else {
    const internalError = new InternalServerError(
      "An unexpected error occurred",
      { cause: err },
    );
    return createErrorResponse(c, internalError);
  }
};
```

## AppEnv Schema

**File**: `src/schemas/app-env.schema.ts`

```typescript
import type { Env } from "hono";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";

export interface AppEnv extends Env {
  Variables: {
    user?: AuthenticatedUserContextType;
    validatedQuery?: unknown;
    validatedBody?: unknown;
    validatedParams?: unknown;
  };
  Bindings: Record<string, unknown>;
}
```

## Usage Examples

### In Routes

```typescript
import { Hono } from "hono";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validation.middleware";
import { createNoteSchema, noteQueryParamsSchema } from "@/schemas/note.schema";
import { entityIdParamSchema } from "@/schemas/shared.schema";
import { NoteController } from "@/controllers/note.controller";
import type { AppEnv } from "@/schemas/app-env.schema";

const router = new Hono<AppEnv>();
const controller = new NoteController();

// List with query validation
router.get(
  "/",
  authMiddleware,
  validate({
    schema: noteQueryParamsSchema,
    source: "query",
    varKey: "validatedQuery",
  }),
  controller.getAll,
);

// Create with body validation
router.post(
  "/",
  authMiddleware,
  validate({
    schema: createNoteSchema,
    source: "body",
    varKey: "validatedBody",
  }),
  controller.create,
);

// Get by ID with params validation
router.get(
  "/:id",
  authMiddleware,
  validate({
    schema: entityIdParamSchema,
    source: "params",
    varKey: "validatedParams",
  }),
  controller.getById,
);

// Update with both params and body validation
router.patch(
  "/:id",
  authMiddleware,
  validate({
    schema: entityIdParamSchema,
    source: "params",
    varKey: "validatedParams",
  }),
  validate({
    schema: updateNoteSchema,
    source: "body",
    varKey: "validatedBody",
  }),
  controller.update,
);

export { router as noteRouter };
```

### In App Setup

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { globalErrorHandler } from "@/errors";
import { noteRouter } from "@/routes/note.router";
import type { AppEnv } from "@/schemas/app-env.schema";

const app = new Hono<AppEnv>();

// Global middleware
app.use("*", cors());

// Register error handler
app.onError(globalErrorHandler);

// Mount routes
app.route("/notes", noteRouter);

export { app };
```

## Key Patterns Summary

| Pattern            | Description                                            |
| ------------------ | ------------------------------------------------------ |
| Factory + Default  | `createAuthMiddleware(deps)` + `authMiddleware` export |
| Generic Validation | Single `validate()` function for body/query/params     |
| Context Variables  | `c.set("user", ...)` → `c.var.user`                    |
| Error Propagation  | Throw domain errors, global handler converts to HTTP   |
| AppEnv Typing      | Always use `Context<AppEnv>` for type-safe variables   |
