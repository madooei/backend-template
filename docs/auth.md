# User Authentication and Authorization

This document explains how user authentication and authorization work within this API service.

## Authentication

The current template does not perform user authentication directly. User registration and related operations (login, password reset, etc.) are not implemented here. Instead, it relies on an authentication Bearer token provided with each API request to an external User Authentication Service (`auth-service`) to verify and retrieve user information.

The interaction and data flow follows these steps:

1. The client provides an authentication token in the `Authorization` header: `Authorization: Bearer <token>`
2. The API service extracts the `<token>` through the Auth Middleware
3. The Auth Middleware interacts with Authentication Service to verify the token and retrieve user information
4. The Authentication Service delegates to an external User Authentication Service (`${AUTH_SERVICE_URL}/auth/me` where `AUTH_SERVICE_URL` is an environment variable)
5. The Authentication Service passes the user information to the Auth Middleware, which then injects it into the request context and makes it available to downstream services
6. The Auth Service and Middleware throw approperiate errors to account for different error scenarios, e.g. invalid token, insufficient permissions, service unavailable, etc.

## Authorization

The curent template accomodates a simple role-based authorization scheme.

- `admin` role: Has full access to all resources
- `user` role: Has access to their own resources

The user roles are defined in `src/schemas/roles.schemas.ts`.

The authorization logic is implemented in `src/services/authorization.service.ts`.

The service layer is primarily responsible for checking if a user has the necessary permissions to perform an action.

## Testing and Development Considerations

A mock `auth-service` is available for testing and local development. Start it by running `scripts/mock-auth-server.ts` at `http://localhost:3333`.
