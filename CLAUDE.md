# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development

- `pnpm dev` - Start development server with hot reload (includes mock auth server)
- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test -- tests/path/to/file.test.ts` - Run specific test file
- `pnpm test:coverage` - Run tests with coverage report

### Code Quality

- `pnpm lint` - Check code with ESLint
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format:fix` - Auto-format code with Prettier
- `pnpm type-check` - TypeScript type checking
- `pnpm validate` - Run all quality checks (type-check + lint:fix + format:fix + test)

### Build & Production

- `pnpm build` - Build for production using tsup
- `pnpm start` - Start production server
- `pnpm clean` - Remove dist and coverage directories

## Architecture Overview

This is a **6-layer TypeScript backend** built with Hono.js following strict architectural patterns:

```
Routes Layer ← HTTP route definitions and middleware application
Controllers ← HTTP request/response handling
Middlewares ← Cross-cutting concerns (auth, validation, errors)
Services ← Business logic and orchestration + Event Emission
Repositories ← Data access abstraction
Schemas ← Data structure and validation (Zod)
```

### Key Architectural Principles

1. **Schema-First Design**: All types defined in `src/schemas/` using Zod with TypeScript inference
2. **Dependency Injection**: Services inject repository interfaces, controllers inject services
3. **Event-Driven Architecture**: Services emit events via BaseService for real-time SSE updates
4. **Path Aliases**: Always use `@/` instead of relative imports (`@/*` maps to `src/*`)
5. **Strict Validation**: Zod schemas validate both request data and database responses

### Layer Responsibilities

- **Schemas (`src/schemas/`)**: Zod schemas with inferred TypeScript types. Export both schema and type.
- **Repositories (`src/repositories/`)**: Interface + implementation pattern. Mock implementations in `/mockdb/` subdirectory.
- **Services (`src/services/`)**: Extend BaseService for event emission. Handle business logic and authorization.
- **Controllers (`src/controllers/`)**: Thin layer converting service calls to HTTP responses.
- **Middlewares (`src/middlewares/`)**: Authentication via external service, validation, error handling.
- **Routes (`src/routes/`)**: Feature-based routers with dependency injection pattern.

## File Naming Conventions

Follow `entity-name.type.ts` pattern:

- Schemas: `entity-name.schema.ts`
- Repositories: `entity-name.repository.ts` (interface), `entity-name.mockdb.repository.ts` (implementation)
- Services: `entity-name.service.ts`
- Controllers: `entity-name.controller.ts`
- Routes: `entity-name.router.ts`
- Tests: Mirror source structure with `.test.ts` suffix

## Testing Strategy

Test each layer in isolation by mocking dependencies:

- **Controllers**: Mock services, test HTTP handling
- **Services**: Mock repositories, test business logic
- **Repositories**: Use test databases, test data access
- **Middlewares**: Mock context and next function
- **Routes**: Test route configuration and middleware chaining
- **Schemas**: Test Zod validation rules

Use Vitest with dependency injection for clean, fast tests.

## Environment Configuration

All environment variables must be:

1. Defined and validated in `src/env.ts` using Zod
2. Documented in `.env.example`
3. Imported from `src/env.ts` (never use `process.env` directly)

## Event System

Built-in real-time capabilities via Server-Sent Events:

- Services extend `BaseService` for automatic event emission
- Events streamed via `/events` SSE endpoint
- Event types defined in `src/schemas/event.schema.ts`
- Authentication required for SSE connections

## External Dependencies

- **Authentication**: Requires external auth service (mock available at `scripts/mock-auth-server.ts`)
- **Database**: Currently uses mock repositories; designed for easy MongoDB integration
- **CORS**: Enabled for all routes for development convenience

## Development Workflow

1. Authentication service must be running (`npx tsx scripts/mock-auth-server.ts`)
2. Use Docker development container (recommended) or local Node.js
3. VS Code debugger configured for both app and scripts
4. Hot reload enabled for development server

## Memory Bank Integration

This project includes Cursor Memory Bank files in `docs/memory-bank/` that provide additional context about project goals, system patterns, and current development status.
