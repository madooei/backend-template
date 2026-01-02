---
name: bootstrap-project
description: Initialize a new backend project following template patterns. Use when starting a new service from scratch. Triggers on "new project", "bootstrap", "start from scratch", "initialize project".
---

# Bootstrap Project

Initializes a new backend project following the 6-layer architecture patterns.

## Quick Reference

**Use when**: Creating a new backend service from scratch (not from the template)
**Result**: A fully structured project ready for adding resources

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Git installed

## Instructions

### Phase 1: Project Initialization

#### Step 1: Create Project Directory

```bash
mkdir my-backend-service
cd my-backend-service
git init
```

#### Step 2: Initialize Package

```bash
pnpm init
```

#### Step 3: Install Dependencies

```bash
# Core dependencies
pnpm add hono zod uuid

# Development dependencies
pnpm add -D typescript tsx tsup vitest @types/node @types/uuid
pnpm add -D eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
pnpm add -D eslint-config-prettier eslint-plugin-prettier
```

#### Step 4: Create TypeScript Config

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Step 5: Create Build Config

Create `tsup.config.ts`:

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  target: "node18",
  outDir: "dist",
  esbuildOptions(options) {
    options.alias = {
      "@": "./src",
    };
  },
});
```

#### Step 6: Create Vitest Config

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    globals: false,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules/", "tests/", "dist/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

#### Step 7: Update package.json Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsup",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit",
    "lint": "eslint src tests --ext .ts",
    "lint:fix": "eslint src tests --ext .ts --fix",
    "format:fix": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\"",
    "validate": "pnpm type-check && pnpm lint:fix && pnpm format:fix && pnpm test",
    "clean": "rm -rf dist coverage"
  },
  "type": "module"
}
```

### Phase 2: Directory Structure

#### Step 8: Create Directory Structure

```bash
mkdir -p src/{controllers,errors,events,middlewares,repositories/mockdb,routes,schemas,services,config}
mkdir -p tests/{controllers,middlewares,repositories,routes,schemas,services}
mkdir -p scripts
```

### Phase 3: Core Infrastructure Files

#### Step 9: Create Environment Config

Create `src/env.ts`:

```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  AUTH_SERVICE_URL: z.string().url().optional(),
});

const mappedEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
};

export const env = envSchema.parse(mappedEnv);
export { envSchema };
```

Create `.env.example`:

```bash
NODE_ENV=development
PORT=3000
AUTH_SERVICE_URL=http://localhost:3333
```

Create `.env`:

```bash
NODE_ENV=development
PORT=3000
AUTH_SERVICE_URL=http://localhost:3333
```

#### Step 10: Create Error Infrastructure

Create `src/errors.ts`:

```typescript
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "@/schemas/app-env.schema";

type ErrorCode = number;

interface BaseErrorOptions {
  cause?: unknown;
  errorCode?: ErrorCode;
}

export class BaseError extends Error {
  public readonly cause?: unknown;
  public readonly errorCode?: ErrorCode;

  constructor(message: string, options?: BaseErrorOptions) {
    super(message);
    this.name = this.constructor.name;
    this.cause = options?.cause;
    this.errorCode = options?.errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toJSON(): { error: string; code?: ErrorCode; cause?: string } {
    const json: { error: string; code?: ErrorCode; cause?: string } = {
      error: this.message,
    };
    if (this.errorCode !== undefined) {
      json.code = this.errorCode;
    }
    if (this.cause instanceof Error && this.cause.message) {
      json.cause = this.cause.message;
    }
    return json;
  }
}

export class BadRequestError extends BaseError {
  constructor(
    message: string = "Bad Request",
    options?: Omit<BaseErrorOptions, "errorCode">,
  ) {
    super(message, { ...options, errorCode: 400 });
  }
}

export class UnauthenticatedError extends BaseError {
  constructor(
    message: string = "Authentication required",
    options?: Omit<BaseErrorOptions, "errorCode">,
  ) {
    super(message, { ...options, errorCode: 401 });
  }
}

export class UnauthorizedError extends BaseError {
  constructor(
    message: string = "Access denied",
    options?: Omit<BaseErrorOptions, "errorCode">,
  ) {
    super(message, { ...options, errorCode: 403 });
  }
}

export class NotFoundError extends BaseError {
  constructor(
    message: string = "Resource not found",
    options?: Omit<BaseErrorOptions, "errorCode">,
  ) {
    super(message, { ...options, errorCode: 404 });
  }
}

export class InternalServerError extends BaseError {
  constructor(
    message: string = "Internal server error",
    options?: Omit<BaseErrorOptions, "errorCode">,
  ) {
    super(message, { ...options, errorCode: 500 });
  }
}

export class ServiceUnavailableError extends BaseError {
  constructor(
    message: string = "Service temporarily unavailable",
    options?: Omit<BaseErrorOptions, "errorCode">,
  ) {
    super(message, { ...options, errorCode: 503 });
  }
}

function createErrorResponse(c: Context<AppEnv>, error: BaseError) {
  const statusCode = error.errorCode || 500;
  return c.json(error.toJSON(), statusCode as any);
}

export const globalErrorHandler = (err: Error, c: Context<AppEnv>) => {
  console.error(err);

  if (err instanceof BaseError) {
    return createErrorResponse(c, err);
  } else if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  } else {
    const internalError = new InternalServerError(
      "An unexpected error occurred",
      { cause: err },
    );
    return createErrorResponse(c, internalError);
  }
};
```

#### Step 11: Create Schema Infrastructure

Create `src/schemas/app-env.schema.ts`:

```typescript
import type { AuthenticatedUserContextType } from "./user.schemas";

export interface AppEnv {
  Variables: {
    user: AuthenticatedUserContextType;
    validatedBody: unknown;
    validatedQuery: unknown;
    validatedParams: unknown;
  };
}
```

Create `src/schemas/user.schemas.ts`:

```typescript
import { z } from "zod";

export const userIdSchema = z.string();
export type UserIdType = z.infer<typeof userIdSchema>;

export const globalRoleSchema = z.enum(["admin", "user"]);
export type GlobalRoleType = z.infer<typeof globalRoleSchema>;

export const authenticatedUserContextSchema = z.object({
  userId: userIdSchema,
  globalRole: globalRoleSchema,
});
export type AuthenticatedUserContextType = z.infer<
  typeof authenticatedUserContextSchema
>;
```

Create `src/schemas/shared.schema.ts`:

```typescript
import { z } from "zod";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;

export const queryParamsSchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});
export type QueryParamsType = z.infer<typeof queryParamsSchema>;

export const paginatedResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  });
export type PaginatedResultType<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const entityIdParamSchema = (paramName: string = "id") =>
  z.object({
    [paramName]: z.string(),
  });
export type EntityIdParamType = { id: string };
```

#### Step 12: Create Event Infrastructure

Create `src/events/event-emitter.ts`:

```typescript
import { EventEmitter } from "events";
import type { ServiceEventType } from "@/schemas/event.schema";

class AppEventEmitter extends EventEmitter {
  emitServiceEvent(serviceName: string, event: ServiceEventType) {
    this.emit(`${serviceName}:${event.action}`, event);
  }
}

export const appEvents = new AppEventEmitter();
```

Create `src/events/base.service.ts`:

```typescript
import { appEvents } from "./event-emitter";
import type { ServiceEventType } from "@/schemas/event.schema";
import { v4 as uuidv4 } from "uuid";

export abstract class BaseService {
  constructor(protected serviceName: string) {}

  protected emitEvent<T>(
    action: ServiceEventType["action"],
    data: T,
    options?: {
      id?: string;
      user?: { userId: string; [key: string]: unknown };
    },
  ) {
    const eventUser = options?.user
      ? {
          id: options.user.userId,
          ...options.user,
        }
      : undefined;

    appEvents.emitServiceEvent(this.serviceName, {
      id: options?.id || uuidv4(),
      action,
      data,
      user: eventUser,
      timestamp: new Date(),
      resourceType: this.serviceName,
    });
  }
}
```

Create `src/schemas/event.schema.ts`:

```typescript
import { z } from "zod";

export const serviceEventSchema = z.object({
  id: z.string(),
  action: z.enum(["created", "updated", "deleted"]),
  data: z.unknown(),
  user: z
    .object({
      id: z.string(),
    })
    .passthrough()
    .optional(),
  timestamp: z.date(),
  resourceType: z.string(),
});

export type ServiceEventType = z.infer<typeof serviceEventSchema>;
```

#### Step 13: Create Middleware Infrastructure

Create `src/middlewares/validation.middleware.ts`:

```typescript
import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import type { ZodTypeAny } from "zod";
import type { AppEnv } from "@/schemas/app-env.schema";
import { BadRequestError, InternalServerError } from "@/errors";

export type ValidationDataSource = "body" | "query" | "params";

interface ValidationOptions {
  schema: ZodTypeAny;
  source: ValidationDataSource;
  varKey: string;
}

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
          throw new InternalServerError();
      }
    } catch (error) {
      if (error instanceof InternalServerError) throw error;
      throw new BadRequestError(`Invalid request ${source}.`);
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

#### Step 14: Create App and Server

Create `src/app.ts`:

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "@/schemas/app-env.schema";
import { globalErrorHandler } from "@/errors";

const app = new Hono<AppEnv>();

// Global middleware
app.use("*", cors());

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Error handler
app.onError(globalErrorHandler);

export { app };
```

Create `src/server.ts`:

```typescript
import { serve } from "@hono/node-server";
import { app } from "./app";
import { env } from "./env";

const port = env.PORT;

console.log(`Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);
```

Install the server adapter:

```bash
pnpm add @hono/node-server
```

### Phase 4: Utility Services

#### Step 15: Create Authorization Service

Create `src/services/authorization.service.ts`:

```typescript
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";

export class AuthorizationService {
  isAdmin(user: AuthenticatedUserContextType): boolean {
    return user.globalRole === "admin";
  }
}
```

### Phase 5: Git Configuration

#### Step 16: Create .gitignore

Create `.gitignore`:

```
node_modules/
dist/
coverage/
.env
*.log
.DS_Store
```

### Phase 6: Verification

#### Step 17: Verify Setup

```bash
# Type check
pnpm type-check

# Start dev server
pnpm dev

# In another terminal, test health endpoint
curl http://localhost:3000/health
```

## Next Steps

After bootstrapping, you can add your first resource:

1. Use `create-resource` skill to create a complete resource
2. Use `setup-mongodb` skill if you need MongoDB
3. Add authentication middleware using `create-middleware` skill

## Files Created Summary

```
my-backend-service/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── env.ts
│   ├── errors.ts
│   ├── config/
│   ├── controllers/
│   ├── events/
│   │   ├── base.service.ts
│   │   └── event-emitter.ts
│   ├── middlewares/
│   │   └── validation.middleware.ts
│   ├── repositories/
│   │   └── mockdb/
│   ├── routes/
│   ├── schemas/
│   │   ├── app-env.schema.ts
│   │   ├── event.schema.ts
│   │   ├── shared.schema.ts
│   │   └── user.schemas.ts
│   └── services/
│       └── authorization.service.ts
├── tests/
│   ├── controllers/
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── schemas/
│   └── services/
├── scripts/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

## What NOT to Do

- Do NOT skip the TypeScript configuration
- Do NOT use relative imports (use `@/` path alias)
- Do NOT commit `.env` file (only `.env.example`)
- Do NOT skip the error infrastructure

## See Also

- `create-resource` - Create your first resource
- `setup-mongodb` - Add MongoDB support
- `create-middleware` - Add authentication middleware
