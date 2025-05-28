# Technical Context

## Technology Stack

### Core Technologies

- **Runtime**: Node.js (v24+)
- **Language**: TypeScript (v5.8+) with strict type checking
- **Framework**: Hono.js (v4.7+) - Modern, lightweight web framework
- **Package Manager**: pnpm (preferred for performance and disk efficiency)
- **Module System**: ES Modules (`"type": "module"` in package.json)

### Development Tools

- **Build Tool**: Tsup (production builds) + tsx (development with hot reload)
- **Linter**: ESLint v9 with TypeScript ESLint plugin
- **Formatter**: Prettier with ESLint integration
- **Testing**: Vitest with coverage reporting and UI
- **Type Checking**: TypeScript compiler with strict settings

### Validation and Schemas

- **Schema Validation**: Zod (v3.25+) for runtime validation and type inference
- **Environment Variables**: Zod-validated environment configuration
- **Request/Response**: Schema-first API design with automatic type generation

### Development Environment

- **Editor**: VS Code with recommended extensions
- **Containerization**: Docker with development containers support
- **Debugging**: VS Code debugger with source map support
- **Hot Reload**: tsx watch for instant development feedback

## Development Setup

### Prerequisites

- Node.js v24+ (Bullseye slim in Docker)
- pnpm package manager
- Docker and Docker Compose (for containerized development)
- VS Code with Remote Containers extension (recommended)

### Environment Configuration

- **Environment Files**: `.env` (local), `.env.example` (template)
- **Validation**: All environment variables validated with Zod schemas in `src/env.ts`
- **Type Safety**: Environment variables are typed and validated at startup

### Key Environment Variables

```bash
# Application
PORT=3000
NODE_ENV=development

# External Services
AUTH_SERVICE_URL=http://localhost:3333

# Database (examples for future use)
# MONGODB_HOST=localhost
# MONGODB_PORT=27017
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
```

## Build and Deployment

### Development Build

- **Command**: `pnpm dev`
- **Process**: Concurrent tsx watch for both main app and mock auth server
- **Features**: Hot reload, source maps, TypeScript compilation on-the-fly

### Production Build

- **Command**: `pnpm build`
- **Tool**: Tsup with optimized configuration
- **Output**: `dist/` directory with compiled JavaScript
- **Optimization**: Tree shaking, minification, source maps

### Docker Configuration

#### Development Container

- **Base Image**: `node:24-bullseye-slim`
- **Features**: Volume mounting for live code changes, pnpm installation
- **VS Code Integration**: `.devcontainer/devcontainer.json` for seamless development

#### Production Container

- **Multi-stage Build**: Separate build and runtime stages
- **Optimization**: Minimal final image size, production dependencies only
- **Security**: Non-root user execution

## Testing Infrastructure

### Testing Framework

- **Primary**: Vitest (Jest-compatible API with better TypeScript support)
- **Coverage**: V8 coverage provider with HTML reports
- **UI**: Vitest UI for interactive test running
- **Watch Mode**: Automatic test re-running on file changes

### Testing Strategy

- **Unit Tests**: Each layer tested in isolation with mocked dependencies
- **Integration Tests**: Full request flow testing
- **Coverage Target**: 90%+ code coverage
- **Mock Strategy**: Vi.mock for modules, manual mocks for repositories

### Test Organization

```plaintext
tests/
├── controllers/     # Controller layer tests
├── services/        # Service layer tests
├── repositories/    # Repository layer tests
├── middlewares/     # Middleware tests
├── routes/          # Route configuration tests
└── schemas/         # Schema validation tests
```

## Code Quality Tools

### ESLint Configuration

- **Version**: ESLint v9 with flat config
- **Plugins**: TypeScript ESLint, Prettier integration
- **Rules**: Strict TypeScript rules, consistent code style
- **Integration**: VS Code extension for real-time feedback

### Prettier Configuration

- **Format on Save**: Automatic code formatting
- **Integration**: ESLint plugin for conflict resolution
- **Configuration**: `prettier.config.json` for project-wide settings

### TypeScript Configuration

- **Strict Mode**: All strict flags enabled
- **Path Mapping**: `@/*` alias for `src/*` imports
- **Target**: ES2022 for modern JavaScript features
- **Module Resolution**: Node.js resolution with ES modules

## External Dependencies

### Production Dependencies

- **@hono/node-server**: Node.js adapter for Hono.js
- **dotenv**: Environment variable loading
- **hono**: Core web framework
- **uuid**: UUID generation utilities
- **zod**: Schema validation and type inference

### Development Dependencies

- **@types/node**: Node.js type definitions
- **@vitest/coverage-v8**: Test coverage reporting
- **eslint**: Code linting
- **prettier**: Code formatting
- **tsup**: Build tool for TypeScript
- **tsx**: TypeScript execution with hot reload
- **typescript**: TypeScript compiler
- **vitest**: Testing framework

## Authentication Architecture

### External Authentication Service

- **Pattern**: Bearer token validation with external service
- **Mock Service**: `scripts/mock-auth-server.ts` for development
- **Integration**: HTTP calls to `${AUTH_SERVICE_URL}/auth/me`
- **Error Handling**: Proper error mapping for auth failures

### Authorization Model

- **Roles**: Admin and User roles defined in schemas
- **Service Layer**: Fine-grained permission checks
- **Middleware**: Token validation and user context injection

## Development Workflow

### Local Development

1. **Setup**: Copy `.env.example` to `.env`
2. **Install**: `pnpm install`
3. **Start**: `pnpm dev` (starts both app and mock auth server)
4. **Test**: `pnpm test` or `pnpm test:watch`

### Docker Development

1. **Container**: VS Code "Reopen in Container"
2. **Auto-setup**: Dependencies installed automatically
3. **Port Forwarding**: Automatic port mapping for services
4. **Volume Mounting**: Live code changes reflected in container

### Code Quality Workflow

1. **Pre-commit**: ESLint and Prettier checks
2. **Testing**: Vitest with coverage reporting
3. **Type Checking**: TypeScript compiler validation
4. **CI/CD Ready**: All tools configured for automation

## Performance Considerations

### Framework Choice

- **Hono.js**: Lightweight, fast, modern web framework
- **TypeScript**: Compile-time optimizations and type safety
- **ES Modules**: Modern module system for better tree shaking

### Build Optimizations

- **Tsup**: Fast build tool with esbuild under the hood
- **Tree Shaking**: Automatic removal of unused code
- **Source Maps**: Development debugging without performance impact

### Runtime Optimizations

- **Stateless Design**: Horizontal scaling support
- **Minimal Dependencies**: Reduced bundle size and startup time
- **Efficient Validation**: Zod schemas for fast runtime validation

## Monitoring and Observability

### Health Checks

- **Endpoint**: `/health` for service health monitoring
- **Response**: JSON status indicator
- **Integration**: Ready for load balancer health checks

### Error Handling

- **Global Handler**: Centralized error processing
- **Structured Logging**: Consistent error format
- **HTTP Status Codes**: Proper status code mapping

### Development Debugging

- **VS Code Integration**: Full debugging support with breakpoints
- **Source Maps**: TypeScript debugging in development
- **Console Logging**: Structured logging for development insights
