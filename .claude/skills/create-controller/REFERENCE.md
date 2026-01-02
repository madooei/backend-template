# Controller Reference

Complete implementation example for a controller.

## Full Example: `note.controller.ts`

```typescript
import type { Context } from "hono";
import { NoteService } from "@/services/note.service";
import type { EntityIdParamType } from "@/schemas/shared.schema";
import type {
  CreateNoteType,
  NoteQueryParamsType,
  UpdateNoteType,
} from "@/schemas/note.schema";
import type { AppEnv } from "@/schemas/app-env.schema";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";
import { NotFoundError } from "@/errors";

export class NoteController {
  private noteService: NoteService;

  constructor(noteService?: NoteService) {
    if (noteService) {
      this.noteService = noteService;
    } else {
      this.noteService = new NoteService();
    }
  }

  getAll = async (c: Context<AppEnv>): Promise<Response> => {
    const user = c.var.user as AuthenticatedUserContextType;
    const query = c.var.validatedQuery as NoteQueryParamsType;
    const notes = await this.noteService.getAll(query, user);
    return c.json(notes);
  };

  getById = async (c: Context<AppEnv>): Promise<Response> => {
    const user = c.var.user as AuthenticatedUserContextType;
    const { id } = c.var.validatedParams as EntityIdParamType;
    const note = await this.noteService.getById(id, user);
    if (!note) throw new NotFoundError();
    return c.json(note);
  };

  create = async (c: Context<AppEnv>): Promise<Response> => {
    const user = c.var.user as AuthenticatedUserContextType;
    const body = c.var.validatedBody as CreateNoteType;
    const note = await this.noteService.create(body, user);
    return c.json(note);
  };

  update = async (c: Context<AppEnv>): Promise<Response> => {
    const user = c.var.user as AuthenticatedUserContextType;
    const { id } = c.var.validatedParams as EntityIdParamType;
    const body = c.var.validatedBody as UpdateNoteType;
    const note = await this.noteService.update(id, body, user);
    if (!note) throw new NotFoundError();
    return c.json(note);
  };

  delete = async (c: Context<AppEnv>): Promise<Response> => {
    const user = c.var.user as AuthenticatedUserContextType;
    const { id } = c.var.validatedParams as EntityIdParamType;
    const success = await this.noteService.delete(id, user);
    if (!success) throw new NotFoundError();
    return c.json({ message: "Note deleted successfully" });
  };
}
```

## AppEnv Schema

The `AppEnv` type provides type-safe access to context variables:

```typescript
// src/schemas/app-env.schema.ts
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

## Usage in Routes

```typescript
// In routes file
const controller = new NoteController();

// Or with injected service (for testing)
const controller = new NoteController(mockNoteService);

// Wire up routes
router.get("/", authMiddleware, validateQuery(querySchema), controller.getAll);
router.get(
  "/:id",
  authMiddleware,
  validateParams(idSchema),
  controller.getById,
);
router.post("/", authMiddleware, validateBody(createSchema), controller.create);
router.patch(
  "/:id",
  authMiddleware,
  validateParams(idSchema),
  validateBody(updateSchema),
  controller.update,
);
router.delete(
  "/:id",
  authMiddleware,
  validateParams(idSchema),
  controller.delete,
);
```

## Key Patterns

### Arrow Function Handlers

Arrow functions preserve `this` binding when passed as callbacks:

```typescript
// This works - arrow function
getAll = async (c: Context<AppEnv>): Promise<Response> => {
  const result = await this.noteService.getAll(...);  // `this` is correct
  return c.json(result);
};

// This breaks - regular method
async getAll(c: Context<AppEnv>): Promise<Response> {
  const result = await this.noteService.getAll(...);  // `this` is undefined!
  return c.json(result);
}
```

### Extracting Validated Data

Middleware validates and stores data in `c.var`:

```typescript
// Auth middleware sets user
const user = c.var.user as AuthenticatedUserContextType;

// Validation middleware sets validated data
const query = c.var.validatedQuery as NoteQueryParamsType;
const body = c.var.validatedBody as CreateNoteType;
const { id } = c.var.validatedParams as EntityIdParamType;
```

### Error Mapping

| Service Returns            | Controller Action           | HTTP Result |
| -------------------------- | --------------------------- | ----------- |
| Entity                     | `return c.json(entity)`     | 200 OK      |
| `null`                     | `throw new NotFoundError()` | 404         |
| Throws `UnauthorizedError` | Let propagate               | 403         |
| Throws other error         | Let propagate               | 500         |

### Response Patterns

```typescript
// Single entity
return c.json(note);

// Paginated list (already structured by service)
return c.json(notes); // { data: [...], total: n, page: 1, limit: 10, totalPages: n }

// Success message
return c.json({ message: "Note deleted successfully" });

// Custom status (rarely needed - use domain errors instead)
return c.json(note, 201);
```
