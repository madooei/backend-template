# Project Brief

## Project Overview

This is a **Backend Template** project that provides a foundational structure for building RESTful APIs using TypeScript and Hono.js. It serves as a starting point for backend services with a well-defined layered architecture, comprehensive testing setup, and development tooling.

## Core Purpose

- Provide a production-ready template for TypeScript backend services
- Demonstrate best practices for layered architecture in Node.js applications
- Include comprehensive development tooling (linting, formatting, testing, debugging)
- Support both local development and containerized deployment
- Showcase proper separation of concerns across application layers

## Key Requirements

### Functional Requirements

- RESTful API endpoints for CRUD operations
- External authentication service integration (Bearer token-based)
- Role-based authorization (admin/user roles)
- Data validation using Zod schemas
- Error handling with custom error types
- Health check endpoints

### Technical Requirements

- **Language**: TypeScript with strict type checking
- **Framework**: Hono.js for HTTP handling
- **Architecture**: Layered architecture (6 layers)
- **Testing**: Vitest with 90%+ coverage target
- **Bundling**: Tsup for production builds, tsx for development
- **Code Quality**: ESLint + Prettier
- **Containerization**: Docker with development containers support

### Development Requirements

- Hot reload development server
- VS Code integration with debugging support
- Docker development containers
- Mock authentication service for local development
- Comprehensive test suite with mocking

## Success Criteria

1. Clean, maintainable codebase following established patterns
2. Comprehensive test coverage (90%+)
3. Easy local development setup
4. Production-ready deployment configuration
5. Clear documentation and examples
6. Proper error handling and validation
7. Security best practices implementation

## Constraints

- Must use TypeScript for type safety
- External authentication service dependency
- Node.js runtime environment
- Container-first deployment approach
- Stateless application design (no session storage)

## Current Implementation Status

The template includes a complete Note entity implementation demonstrating all architectural layers:

- Model layer with Zod schemas
- Repository pattern with mock database
- Service layer with business logic
- Controller layer for HTTP handling
- Middleware for auth and validation
- Routes with proper organization

This serves as a reference implementation for adding new entities and features.
