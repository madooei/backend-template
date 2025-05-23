# Application Architecture

This document outlines the layered architecture of this application. The architecture is designed to promote separation of concerns, maintainability, and testability.

## Layers Overview

The application follows a common layered architecture pattern, consisting of the following main layers:

1.  **Model Layer (Zod Schemas & TypeScript Types):** Defines the structure, validation, and types for data entities.
2.  **Data Access Layer (Interfaces and Implementations following the Repository Pattern):** Abstracts the interaction with the data store (e.g., MongoDB).
3.  **Services Layer:** Contains the core business logic of the application.
4.  **Controllers Layer:** Handles incoming HTTP requests and outgoing responses.

## Layer Details

### 1. Model Layer (Schemas)

- **Location:** `src/schemas/`
- **Responsibility:**
  - Define the structure and validation rules for data entities (e.g., `Note`, `UserContext`), DTOs (Data Transfer Objects), and query parameters.
  - Utilize Zod for schema definition, which provides both runtime validation and static TypeScript types via `z.infer<typeof schemaName>`.
  - Ensure data integrity and consistency throughout the application.
  - Domain entities are defined with database-agnostic types (e.g., `id: string`).

### 2. Data Access Layer (Repositories)

- **Responsibility:**
  - Abstract data persistence and retrieval logic.
  - Provide a clean API (interfaces) for CRUD (Create, Read, Update, Delete) operations and other data queries for specific entities.
  - Implementations of these interfaces handle the specific database interactions (e.g., using a MongoDB driver).
  - Ensure that the rest of the application (primarily services) is independent of the chosen database technology. Domain models use simple `id: string`, and repositories handle the mapping to/from database-specific ID formats (like MongoDB's `ObjectId`).

### 3. Services Layer

- **Location:** `src/services/`
- **Responsibility:**
  - Implement the core business logic and use cases of the application.
  - Orchestrate operations by interacting with one or more repositories from the Data Access Layer.
  - Perform data transformations and complex validations that are beyond simple schema checks.
  - Decoupled from the specifics of the HTTP layer (controllers) and the database (repositories).

### 4. Controllers Layer

- **Location:** `src/controllers/`
- **Responsibility:**
  - Receive HTTP requests from clients.
  - Parse request parameters, body, and headers.
  - Perform initial input validation (leveraging Zod schemas).
  - Call appropriate methods in the Services Layer to perform business operations.
  - Format and send HTTP responses (data, status codes, error messages).
- **Framework:** Hono.js is used for routing and request/response handling.

This layered approach ensures that each part of the application has a distinct responsibility, making the system easier to develop, test, debug, and maintain. Changes in one layer (e.g., switching the database) should ideally have minimal impact on other layers, provided the interfaces between them are respected.
