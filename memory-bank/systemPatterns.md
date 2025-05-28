# System Patterns

## Architecture Overview

The application follows a strict **6-layer architecture** pattern that ensures clear separation of concerns and maintainability:

```plaintext
┌─────────────────┐
│ Routes Layer   │ ← HTTP route definitions and middleware application
├─────────────────┤
│ Controllers    │ ← HTTP request/response handling
├─────────────────┤
│ Middlewares    │ ← Cross-cutting concerns (auth, validation, errors)
├─────────────────┤
│ Services       │ ← Business logic and orchestration
├─────────────────┤
│ Repositories   │ ← Data access abstraction
├─────────────────┤
│ Models/Schemas │ ← Data structure and validation
└─────────────────┘
```

## Layer Responsibilities

### 1. Model Layer (`src/schemas/`)

- **Purpose**: Single source of truth for data structures and validation
- **Technology**: Zod schemas with TypeScript type inference
- **Pattern**: Schema-first design with automatic type generation
- **Key Files**: `*.schema.ts` files (e.g., `note.schema.ts`, `user.schemas.ts`)

**Example Pattern**:

```typescript
export const noteSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type NoteType = z.infer<typeof noteSchema>;

// DTOs derived from base schema
export const createNoteSchema = noteSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
```

### 2. Repository Layer (`src/repositories/`)

- **Pattern**: Repository Pattern with interface segregation
- **Structure**: Interface definition + multiple implementations
- **Data Mapping**: Database-specific formats ↔ Domain models
- **Validation**: Parse data from DB using Zod schemas

**Key Pattern**:

```typescript
// Interface definition
export interface INoteRepository {
  create(note: CreateNoteType): Promise<NoteType>;
  findById(id: string): Promise<NoteType | null>;
  // ... other methods
}

// Implementation with data mapping
export class MockDbNoteRepository implements INoteRepository {
  private mapDocumentToEntity(doc: any): NoteType {
    return noteSchema.parse({
      id: doc._id?.toString() || doc.id,
      content: doc.content,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
```

### 3. Service Layer (`src/services/`)

- **Purpose**: Business logic, authorization, and data orchestration
- **Dependencies**: Repository interfaces (injected)
- **Responsibilities**: Business rules, multi-repository operations, external API calls
- **Error Handling**: Throws domain-specific Error subclasses

**Key Patterns**:

```typescript
export class NoteService {
  constructor(private noteRepository: INoteRepository) {}

  async createNote(
    data: CreateNoteType,
    user: AuthenticatedUserContextType,
  ): Promise<NoteType> {
    // Business logic and validation
    // Authorization checks
    // Repository operations
    // Return domain objects
  }
}
```

### 4. Controller Layer (`src/controllers/`)

- **Purpose**: HTTP request/response handling
- **Pattern**: Thin controllers that delegate to services
- **Validation**: Uses pre-validated data from middleware
- **Error Mapping**: Converts service errors to HTTP exceptions

**Key Pattern**:

```typescript
export class NoteController {
  constructor(private noteService: NoteService) {}

  async createNote(c: Context<AppEnv>) {
    const validatedBody = c.var.validatedBody as CreateNoteType;
    const user = c.var.user;

    try {
      const note = await this.noteService.createNote(validatedBody, user);
      return c.json(note, 201);
    } catch (error) {
      // Error mapping to HTTP responses
    }
  }
}
```

### 5. Middleware Layer (`src/middlewares/`)

- **Purpose**: Cross-cutting concerns and request preprocessing
- **Types**: Authentication, validation, error handling, logging
- **Pattern**: Hono middleware with context modification

**Key Patterns**:

```typescript
// Validation middleware
export const validateBody = (schema: ZodSchema) => {
  return async (c: Context, next: Next) => {
    const result = schema.safeParse(await c.req.json());
    if (!result.success) {
      throw new BadRequestHTTPException({ message: "Validation failed" });
    }
    c.set("validatedBody", result.data);
    await next();
  };
};
```

### 6. Routes Layer (`src/routes/`)

- **Purpose**: HTTP route definitions and middleware application
- **Pattern**: Feature-based route modules
- **Organization**: One router per domain entity

**Key Pattern**:

```typescript
export function createNoteRoutes({
  noteController,
}: {
  noteController: NoteController;
}) {
  const router = new Hono<AppEnv>();

  router.post("/", authMiddleware, validateBody(createNoteSchema), (c) =>
    noteController.createNote(c),
  );

  return router;
}
```

## Critical Implementation Patterns

### Dependency Injection Pattern

- **Services**: Inject repository interfaces, not concrete implementations
- **Controllers**: Inject service instances
- **Routes**: Inject controller instances
- **Benefits**: Testability, flexibility, loose coupling

### Error Handling Strategy

- **Service Layer**: Throws Error subclasses (NotFoundError, UnauthorizedError, etc.)
- **Controller Layer**: Throws HTTPException subclasses
- **Global Handler**: Maps service errors to HTTP responses
- **Consistency**: Standardized error response format

### Validation Strategy

- **Schema Definition**: Single Zod schema per entity
- **DTO Generation**: Derived schemas for create/update operations
- **Middleware Validation**: Pre-validate requests before controllers
- **Repository Validation**: Parse data from database using schemas

### Authentication/Authorization Flow

1. **Auth Middleware**: Validates Bearer token with external service
2. **User Context**: Populates `c.var.user` with authenticated user info
3. **Service Authorization**: Fine-grained permission checks in business logic
4. **Role-Based Access**: Admin vs User role distinctions

### Testing Patterns

- **Layer Isolation**: Mock dependencies for each layer
- **Repository Mocking**: Use MockDB implementations
- **Service Testing**: Mock repositories, test business logic
- **Controller Testing**: Mock services, test HTTP handling
- **Integration Testing**: Test full request flow

## File Naming Conventions

- **Schemas**: `entity-name.schema.ts`
- **Repositories**: `entity-name.repository.ts` (interface), `entity-name.mockdb.repository.ts` (implementation)
- **Services**: `entity-name.service.ts`
- **Controllers**: `entity-name-controller.ts`
- **Routes**: `entity-name.router.ts`
- **Tests**: Mirror source structure with `.test.ts` suffix

## Import Patterns

- **Path Aliases**: Always use `@/` instead of relative paths
- **File Extensions**: Include `.ts` extension in imports
- **Barrel Exports**: Avoid; prefer explicit imports for clarity

## Environment and Configuration

- **Environment Variables**: Centralized in `src/env.ts` with Zod validation
- **Type Safety**: Environment variables are typed and validated at startup
- **Documentation**: All variables documented in `.env.example`

## Development Workflow Patterns

- **Hot Reload**: `tsx watch` for development server
- **Debugging**: VS Code launch configurations for app and scripts
- **Testing**: Vitest with watch mode and coverage reporting
- **Code Quality**: ESLint + Prettier with pre-commit hooks
- **Containerization**: Docker development containers with VS Code integration
