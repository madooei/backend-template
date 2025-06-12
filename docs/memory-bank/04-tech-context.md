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

# MongoDB URI Configuration
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=backend-template
MONGODB_USER=admin
MONGODB_PASSWORD=admin

# Database (examples for future use)
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
- **hono**: Core web framework (v4.7+ with streaming support for SSE)
- **uuid**: UUID generation utilities
- **zod**: Schema validation and type inference

#### Real-time Features Dependencies

- **Node.js EventEmitter**: Built-in event system for centralized event management
- **Hono Streaming**: Built-in streaming support for Server-Sent Events (SSE)
- **No additional dependencies required**: SSE implementation uses existing Hono.js streaming capabilities

#### Database Integration Dependencies

- **mongodb**: Official MongoDB driver for Node.js - Direct driver usage for educational transparency
- **mongodb-memory-server**: In-memory MongoDB for testing - Provides isolated test environment

**Key Technology Decisions**:

- **Direct MongoDB Driver**: Uses `mongodb` package directly instead of Mongoose for:

  - Educational transparency - students see actual database operations
  - Custom repository pattern implementation
  - Full control over data mapping and validation
  - Reduced abstraction layers for learning purposes

- **Zod Schema Validation**: Uses Zod schemas instead of MongoDB/Mongoose schemas for:

  - Single source of truth for data validation
  - Consistent validation across all layers
  - Type safety with runtime validation
  - Educational clarity in data flow

- **MongoDB Memory Server**: Uses `mongodb-memory-server` for testing to:
  - Provide isolated test environments
  - Enable fast, reliable integration tests
  - Eliminate external database dependencies in CI/CD
  - Teach proper testing strategies for database code

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

## Real-time Features Architecture

### Server-Sent Events (SSE) Implementation

#### Technical Foundation

- **Hono.js Streaming**: Leverages built-in `stream()` function for SSE support
- **Node.js EventEmitter**: Central event hub using native EventEmitter class
- **TypeScript Integration**: Fully typed event system with Zod validation
- **Authentication**: SSE connections authenticated via existing auth middleware

#### Event System Design

```typescript
// Event flow architecture
Service Operation → Event Emission → Central Event Hub → SSE Clients
     ↓                    ↓                ↓              ↓
  Business Logic    BaseService Pattern   EventEmitter   Filtered Stream
```

#### Performance Characteristics

- **Memory Efficient**: Events are not persisted, reducing memory footprint
- **Connection Management**: Automatic cleanup on client disconnect
- **Heartbeat Mechanism**: 30-second intervals to maintain connection health
- **Event Filtering**: Server-side filtering reduces unnecessary network traffic

#### Scalability Considerations

- **Horizontal Scaling**: Event system works within single process (suitable for educational template)
- **Connection Limits**: Node.js can handle thousands of concurrent SSE connections
- **Future Extensions**: Architecture ready for Redis pub/sub for multi-instance scaling
- **Resource Usage**: Minimal CPU overhead for event emission and streaming

### Event-Driven Architecture Benefits

#### Educational Value

- **Real-time Communication**: Students learn SSE vs WebSocket trade-offs
- **Observer Pattern**: Practical implementation of design patterns
- **Decoupled Systems**: Understanding of event-driven architecture principles
- **Scalability Concepts**: Foundation for understanding distributed systems

#### Technical Benefits

- **Loose Coupling**: Services emit events without knowing about consumers
- **Extensibility**: Easy to add new event types and listeners
- **Testing**: Events can be easily mocked and verified in tests
- **Maintainability**: Clear separation between business logic and real-time features

### Implementation Phases

#### Phase 1: Event System Foundation

- Create central event emitter with TypeScript interfaces
- Implement BaseService class for consistent event emission
- Define event schemas with Zod validation

#### Phase 2: Service Integration

- Extend NoteService from BaseService
- Add event emission after successful CRUD operations
- Maintain backward compatibility with existing functionality

#### Phase 3: SSE Endpoint

- Implement authenticated SSE endpoint using Hono streaming
- Add event filtering based on user permissions
- Implement connection management and cleanup

#### Phase 4: Testing & Documentation

- Comprehensive test suite for event system
- Integration tests for full event flow
- Update documentation with usage examples

### Client-Side Integration

#### Browser EventSource API

```javascript
// Example client-side implementation
const eventSource = new EventSource("/api/events", {
  headers: { Authorization: `Bearer ${token}` },
});

eventSource.addEventListener("notes:created", (event) => {
  const data = JSON.parse(event.data);
  // Update UI with new note
});
```

#### Framework Integration

- **React**: Custom hooks for SSE connection management
- **Vue**: Composables for reactive event handling
- **Vanilla JS**: Direct EventSource API usage
- **Error Handling**: Automatic reconnection strategies

### Security Considerations

#### Authentication & Authorization

- **Bearer Token**: SSE connections use existing authentication system
- **Event Filtering**: Server-side filtering prevents unauthorized data access
- **CORS Configuration**: Proper CORS headers for cross-origin requests
- **Rate Limiting**: Future consideration for connection rate limiting

#### Data Privacy

- **Visibility Levels**: Public/private/team event visibility system
- **User Context**: Events include user information for authorization
- **No Persistence**: Events are not stored, reducing data exposure risk
- **Audit Trail**: Event emission can be logged for security auditing

### Monitoring & Debugging

#### Development Tools

- **Browser DevTools**: Network tab shows SSE connection and events
- **VS Code Debugging**: Full debugging support for event system
- **Console Logging**: Structured logging for event emission and handling
- **Test Coverage**: Comprehensive testing for all event scenarios

#### Production Monitoring

- **Connection Metrics**: Track active SSE connections
- **Event Throughput**: Monitor event emission rates
- **Error Tracking**: Log connection failures and event errors
- **Performance Metrics**: Monitor memory usage and response times
