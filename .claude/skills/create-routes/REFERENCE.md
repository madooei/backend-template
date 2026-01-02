# Routes Reference

Complete implementation examples for route definitions.

## Full Example: `note.router.ts`

```typescript
import { Hono } from "hono";
import type { NoteController } from "@/controllers/note.controller";
import type { AppEnv } from "@/schemas/app-env.schema";
import { validate as defaultValidate } from "@/middlewares/validation.middleware";
import { entityIdParamSchema } from "@/schemas/shared.schema";
import { createNoteSchema, noteQueryParamsSchema } from "@/schemas/note.schema";
import { authMiddleware as defaultAuthMiddleware } from "@/middlewares/auth.middleware";

export interface CreateNoteRoutesDeps {
  noteController: NoteController;
  validate?: typeof defaultValidate;
  authMiddleware?: typeof defaultAuthMiddleware;
}

export const createNoteRoutes = (dependencies: CreateNoteRoutesDeps) => {
  const {
    noteController,
    validate = defaultValidate,
    authMiddleware = defaultAuthMiddleware,
  } = dependencies;

  const noteRoutes = new Hono<AppEnv>();

  // Authentication middleware
  noteRoutes.use("*", authMiddleware);

  noteRoutes.get(
    "/",
    validate({
      schema: noteQueryParamsSchema,
      source: "query",
      varKey: "validatedQuery",
    }),
    noteController.getAll,
  );

  noteRoutes.get(
    "/:id",
    validate({
      schema: entityIdParamSchema("id"),
      source: "params",
      varKey: "validatedParams",
    }),
    noteController.getById,
  );

  noteRoutes.post(
    "/",
    validate({
      schema: createNoteSchema,
      source: "body",
      varKey: "validatedBody",
    }),
    noteController.create,
  );

  noteRoutes.put(
    "/:id",
    validate({
      schema: entityIdParamSchema("id"),
      source: "params",
      varKey: "validatedParams",
    }),
    validate({
      schema: createNoteSchema,
      source: "body",
      varKey: "validatedBody",
    }),
    noteController.update,
  );

  noteRoutes.delete(
    "/:id",
    validate({
      schema: entityIdParamSchema("id"),
      source: "params",
      varKey: "validatedParams",
    }),
    noteController.delete,
  );

  return noteRoutes;
};
```

## App Setup: `app.ts`

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createNoteRoutes } from "@/routes/note.router";
import { createEventsRoutes } from "@/routes/events.router";
import { NoteController } from "@/controllers/note.controller";
import { NoteService } from "@/services/note.service";
import { MockDbNoteRepository } from "@/repositories/mockdb/note.mockdb.repository";
import { MongoDbNoteRepository } from "@/repositories/mongodb/note.mongodb.repository";
import type { AppEnv } from "@/schemas/app-env.schema";
import { globalErrorHandler } from "@/errors";
import { env } from "@/env";

export const app = new Hono<AppEnv>();

// Global middleware
app.use("/*", cors());
app.use(logger());

// Root route
app.get("/", (c) => c.text("Hello Hono!"));

// Create dependency chain
const noteRepository =
  env.NODE_ENV === "test"
    ? new MockDbNoteRepository()
    : new MongoDbNoteRepository();
const noteService = new NoteService(noteRepository);
const noteController = new NoteController(noteService);

// Mount routes
app.route("/notes", createNoteRoutes({ noteController }));
app.route("/events", createEventsRoutes());

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// 404 handler (must be last)
app.notFound((c) => c.json({ error: "Not Found" }, 404));

// Global error handler
app.onError(globalErrorHandler);
```

## Events Router Example: `events.router.ts`

SSE endpoint for real-time events:

```typescript
import { Hono } from "hono";
import { appEvents } from "@/events/event-emitter";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { AuthorizationService } from "@/services/authorization.service";
import type { AppEnv } from "@/schemas/app-env.schema";
import type { ServiceEventType } from "@/schemas/event.schema";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";
import { authMiddleware as defaultAuthMiddleware } from "@/middlewares/auth.middleware";

interface SSEController extends ReadableStreamDefaultController<Uint8Array> {
  cleanup?: () => void;
}

interface EventsRouteOptions {
  authMiddleware?: typeof defaultAuthMiddleware;
}

export function createEventsRoutes(options?: EventsRouteOptions) {
  const router = new Hono<AppEnv>();
  const authMiddlewareToUse = options?.authMiddleware || authMiddleware;

  router.get("/", authMiddlewareToUse, async (c) => {
    const currentUser = c.var.user;
    if (!currentUser) {
      return c.text("Unauthorized", 401);
    }

    const authorizationService = new AuthorizationService();

    const readable = new ReadableStream({
      start(controller: SSEController) {
        controller.enqueue(
          new TextEncoder().encode(`data: {"type":"connected"}\n\n`),
        );

        const eventHandler = async (event: ServiceEventType) => {
          try {
            const canReceive = await shouldUserReceiveEvent(
              event,
              currentUser,
              authorizationService,
            );
            if (canReceive) {
              const eventData = `event: notes:${event.action}\ndata: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(new TextEncoder().encode(eventData));
            }
          } catch (error: unknown) {
            console.error("Error in event handler:", error);
          }
        };

        // Listen to events
        appEvents.on("notes:created", eventHandler);
        appEvents.on("notes:updated", eventHandler);
        appEvents.on("notes:deleted", eventHandler);

        // Heartbeat
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
          } catch {
            clearInterval(keepAlive);
          }
        }, 30000);

        // Cleanup function
        controller.cleanup = () => {
          appEvents.off("notes:created", eventHandler);
          appEvents.off("notes:updated", eventHandler);
          appEvents.off("notes:deleted", eventHandler);
          clearInterval(keepAlive);
        };
      },
      cancel(controller: SSEController) {
        if (controller.cleanup) {
          controller.cleanup();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

  return router;
}

async function shouldUserReceiveEvent(
  event: ServiceEventType,
  user: AuthenticatedUserContextType,
  authorizationService: AuthorizationService,
): Promise<boolean> {
  switch (event.resourceType) {
    case "notes":
      if (
        typeof event.data === "object" &&
        event.data !== null &&
        "createdBy" in event.data
      ) {
        return await authorizationService.canReceiveNoteEvent(
          user,
          event.data as { createdBy: string; [key: string]: unknown },
        );
      }
      return false;
    default:
      return false;
  }
}
```

## Route Patterns Summary

| HTTP Method | Path   | Validation                 | Handler              |
| ----------- | ------ | -------------------------- | -------------------- |
| GET         | `/`    | query → `validatedQuery`   | `controller.getAll`  |
| GET         | `/:id` | params → `validatedParams` | `controller.getById` |
| POST        | `/`    | body → `validatedBody`     | `controller.create`  |
| PUT         | `/:id` | params + body              | `controller.update`  |
| PATCH       | `/:id` | params + body (partial)    | `controller.update`  |
| DELETE      | `/:id` | params → `validatedParams` | `controller.delete`  |

## Dependency Injection Flow

```
app.ts
  └── createNoteRoutes({ noteController })
        ├── noteController: NoteController
        ├── validate: defaultValidate (or injected)
        └── authMiddleware: defaultAuthMiddleware (or injected)

NoteController
  └── noteService: NoteService

NoteService
  ├── noteRepository: INoteRepository
  └── authorizationService: AuthorizationService
```
