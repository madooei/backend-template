# Application Architecture

This document outlines the layered architecture of this application. The architecture is designed to promote separation of concerns, maintainability, and testability.

## Layers Overview

The application follows a common layered architecture pattern, consisting of the following main layers:

1.  **Model Layer (Zod Schemas & TypeScript Types):** Defines the structure, validation, and types for data entities.
2.  **Data Access Layer (Interfaces and Implementations following the Repository Pattern):** Abstracts the interaction with the data store (e.g., MongoDB).
3.  **Services Layer:** Contains the core business logic of the application.
4.  **Controllers Layer:** Handles incoming HTTP requests and outgoing responses.
5.  **Middlewares Layer:** Handles cross-cutting concerns that apply to multiple routes or requests.
6.  **Routes Layer:** Defines the specific HTTP routes (e.g., `/notes`, `/notes/:id`) and their corresponding HTTP methods (GET, POST, PUT, DELETE).

## Layer Details

### 1. Model Layer (Schemas)

- **Location:** `src/schemas/` (e.g., `src/schemas/note.schema.ts`)
- **Responsibility:**
  - Define the structure and validation rules for data entities (e.g., `Note`, `UserContext`), DTOs (Data Transfer Objects), and query parameters.
  - Utilize Zod for schema definition, which provides both runtime validation and static TypeScript types via `z.infer<typeof schemaName>`.
  - Ensure data integrity and consistency throughout the application.
  - Domain entities are defined with database-agnostic types (e.g., `id: string`).

### 2. Data Access Layer (Repositories)

- **Location:** `src/repositories/` (e.g., `src/repositories/note.repository.ts`)
- **Responsibility:**
  - Abstract data persistence and retrieval logic.
  - Provide a clean API (interfaces) for CRUD (Create, Read, Update, Delete) operations and other data queries for specific entities.
  - Implementations of these interfaces handle the specific database interactions (e.g., using a MongoDB driver).
  - Ensure that the rest of the application (primarily services) is independent of the chosen database technology. Domain models use simple `id: string`, and repositories handle the mapping to/from database-specific ID formats (like MongoDB's `ObjectId`).

### 3. Services Layer

- **Location:** `src/services/` (e.g., `src/services/note.service.ts`)
- **Responsibility:**
  - Implement the core business logic and use cases of the application.
  - Orchestrate operations by interacting with one or more repositories from the Data Access Layer.
  - Perform data transformations and complex validations that are beyond simple schema checks.
  - Decoupled from the specifics of the HTTP layer (controllers) and the database (repositories).

### 4. Controllers Layer

- **Location:** `src/controllers/` (e.g., `src/controllers/note-controller.ts`)
- **Responsibility:**
  - Receive HTTP requests from clients.
  - Parse request parameters, body, and headers (can delegate to middlewares).
  - Perform initial input validation (leveraging Zod schemas; can delegate to middlewares).
  - Call appropriate methods in the Services Layer to perform business operations.
  - Format and send HTTP responses (data, status codes, error messages; can delegate to middlewares).
- **Framework:** Hono.js is used for routing and request/response handling.

### 5. Middlewares

- **Location:** `src/middlewares/`
- **Responsibility:**
  - Handle cross-cutting concerns that apply to multiple routes or requests.
  - Examples include:
    - **Input Validation (`validation.middleware.ts`):** Using Zod schemas to validate incoming data (body, query, params).
    - **Authentication (`auth.middleware.ts`):** Verifying user identity (via headers or tokens) and populating user context.
    - **Error Handling (`error.middleware.ts`):** Catching errors and formatting standardized error responses.
    - **Logging (`logging.middleware.ts`):** Recording request/response details.
- **Framework:** Hono.js provides a middleware mechanism.

### 6. Routes Layer

- **Location:** `src/routes/` (e.g., `src/routes/note.router.ts`)
- **Responsibility:**
  - Define the specific HTTP routes (e.g., `/notes`, `/notes/:id`) and their corresponding HTTP methods (GET, POST, PUT, DELETE).
  - Import and utilize controller methods as handlers for these routes.
  - Apply route-specific or route-group-specific middleware. For example, validating a path parameter like `:noteId` before it even reaches a group of nested routes, or applying a specialized authorization check for a set of routes.
  - Organize routes into logical modules based on domain or feature (e.g., all note-related routes in `note.router.ts`).
  - Export Hono router instances that are then mounted by `src/app.ts` under specific base paths.
- **Interaction:**
  - Consumed by `src/app.ts` for mounting.
  - Utilizes `Controllers` to handle the actual request logic.
  - May use `Middlewares` for route-specific processing.

This layered approach ensures that each part of the application has a distinct responsibility, making the system easier to develop, test, debug, and maintain. Changes in one layer (e.g., switching the database) should ideally have minimal impact on other layers, provided the interfaces between them are respected.
