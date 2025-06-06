import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import type { Mock } from "vitest";
import { Hono, type Next } from "hono";
import { createNoteRoutes } from "@/routes/note.router";
import { NoteController } from "@/controllers/note.controller";
import { NoteService } from "@/services/note.service";
import { MockDbNoteRepository } from "@/repositories/mockdb/note.mockdb.repository";
import type { AppEnv } from "@/schemas/app-env.schema";
import type {
  AuthenticatedUserContextType,
  UserIdType,
} from "@/schemas/user.schemas";
import type {
  CreateNoteType,
  NoteType,
  UpdateNoteType,
} from "@/schemas/note.schema";
import type { PaginatedResultType } from "@/schemas/shared.schema";
import { HTTPException } from "hono/http-exception";
import {
  BadRequestError,
  globalErrorHandler,
  UnauthenticatedError,
} from "@/errors";

describe("Note Routes (E2E Style with Mock DB and Injected Mocks)", () => {
  let app: Hono<AppEnv>;
  let mockDbRepo: MockDbNoteRepository;
  let noteService: NoteService;
  let noteController: NoteController;

  // Mock functions for dependency injection
  let mockAuthMiddleware: Mock;
  let mockValidateFactory: Mock;

  const testUser: AuthenticatedUserContextType = {
    userId: "user-test-123" as UserIdType,
    globalRole: "user",
  };
  const otherTestUser: AuthenticatedUserContextType = {
    userId: "user-other-456" as UserIdType,
    globalRole: "user",
  };

  beforeEach(async () => {
    // Create fresh mock functions for each test
    mockAuthMiddleware = vi.fn(async (c: any, next: Next) => {
      c.set("user", testUser); // Default successful authentication
      await next();
    });

    mockValidateFactory = vi.fn((validationConfig: any) => {
      // Default successful validation middleware
      return vi.fn(async (c: any, next: Next) => {
        if (validationConfig.varKey && validationConfig.source === "params") {
          const idFromPath = c.req.param("id");
          c.set(validationConfig.varKey, { id: idFromPath });
        } else if (
          validationConfig.varKey &&
          validationConfig.source === "query"
        ) {
          c.set(validationConfig.varKey, { ...c.req.query() });
        } else if (
          validationConfig.varKey &&
          validationConfig.source === "body"
        ) {
          try {
            const body = await c.req.json();
            c.set(validationConfig.varKey, body);
          } catch (e) {
            c.set(validationConfig.varKey, {});
          }
        }
        await next();
      });
    });

    mockDbRepo = new MockDbNoteRepository();
    mockDbRepo.clear();

    noteService = new NoteService(mockDbRepo);
    noteController = new NoteController(noteService);

    app = new Hono<AppEnv>();
    app.onError(globalErrorHandler);
    // Route setup will happen in each test or a nested describe for common routes
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to set up routes for most tests
  const setupRoutes = () => {
    app.route(
      "/notes",
      createNoteRoutes({
        noteController,
        authMiddleware: mockAuthMiddleware,
        validate: mockValidateFactory,
      }),
    );
  };

  it("GET /notes/:id - should retrieve an existing note by the authenticated user", async () => {
    setupRoutes();
    const noteData: CreateNoteType = { content: "A specific test note" };
    const createdNote = await mockDbRepo.create(noteData, testUser.userId);

    const response = await app.request(`/notes/${createdNote.id}`, {
      method: "GET",
    });

    expect(response.status).toBe(200);
    const responseBody = (await response.json()) as NoteType;
    expect(responseBody.id).toBe(createdNote.id);
    expect(responseBody.content).toBe(createdNote.content);
    expect(responseBody.createdBy).toBe(testUser.userId);
  });

  it("GET /notes - should retrieve all notes for the authenticated user", async () => {
    setupRoutes();
    await mockDbRepo.create({ content: "Note 1 by user 1" }, testUser.userId);
    await mockDbRepo.create({ content: "Note 2 by user 1" }, testUser.userId);
    await mockDbRepo.create(
      { content: "Note 1 by user 2" },
      otherTestUser.userId,
    );

    const response = await app.request("/notes", { method: "GET" });

    expect(response.status).toBe(200);
    const responseBody =
      (await response.json()) as PaginatedResultType<NoteType>;
    expect(responseBody.data).toHaveLength(2);
    expect(
      responseBody.data.every((note) => note.createdBy === testUser.userId),
    ).toBe(true);
    expect(responseBody.total).toBe(2);
  });

  it("GET /notes - should filter notes by createdBy query parameter", async () => {
    setupRoutes();
    await mockDbRepo.create({ content: "Note 1 by user 1" }, testUser.userId);
    await mockDbRepo.create(
      { content: "Note 1 by user 2 for query" },
      otherTestUser.userId,
    );

    const response = await app.request(`/notes?createdBy=${testUser.userId}`, {
      method: "GET",
    });

    expect(response.status).toBe(200);
    const responseBody =
      (await response.json()) as PaginatedResultType<NoteType>;
    expect(responseBody.data).toHaveLength(1);
    expect(responseBody.data[0].content).toBe("Note 1 by user 1");
    expect(responseBody.total).toBe(1);
  });

  it("POST /notes - should create a new note for the authenticated user", async () => {
    setupRoutes();
    const notePayload: CreateNoteType = { content: "Newly created note" };

    const response = await app.request("/notes", {
      method: "POST",
      body: JSON.stringify(notePayload),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(200);
    const responseBody = (await response.json()) as NoteType;
    expect(responseBody.id).toBeDefined();
    expect(responseBody.content).toBe(notePayload.content);
    expect(responseBody.createdBy).toBe(testUser.userId);

    const dbNote = await mockDbRepo.findById(responseBody.id);
    expect(dbNote).toBeDefined();
    expect(dbNote?.content).toBe(notePayload.content);
  });

  it("PUT /notes/:id - should update an existing note by the authenticated user", async () => {
    setupRoutes();
    const initialNote = await mockDbRepo.create(
      { content: "Original content" },
      testUser.userId,
    );
    const updatePayload: UpdateNoteType = { content: "Updated content" };

    const response = await app.request(`/notes/${initialNote.id}`, {
      method: "PUT",
      body: JSON.stringify(updatePayload),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(200);
    const responseBody = (await response.json()) as NoteType;
    expect(responseBody.id).toBe(initialNote.id);
    expect(responseBody.content).toBe(updatePayload.content);
    expect(responseBody.updatedAt).not.toBe(initialNote.updatedAt);

    const dbNote = await mockDbRepo.findById(initialNote.id);
    expect(dbNote?.content).toBe(updatePayload.content);
  });

  it("DELETE /notes/:id - should delete an existing note by the authenticated user", async () => {
    setupRoutes();
    const noteToDelete = await mockDbRepo.create(
      { content: "To be deleted" },
      testUser.userId,
    );

    const response = await app.request(`/notes/${noteToDelete.id}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(200);
    const responseBody = (await response.json()) as { message: string };
    expect(responseBody.message).toBe("Note deleted successfully");

    const dbNote = await mockDbRepo.findById(noteToDelete.id);
    expect(dbNote).toBeNull();
  });

  it("GET /notes/:id - should return 404 if note not found", async () => {
    setupRoutes();
    const nonExistentId = "non-existent-id-123";
    const response = await app.request(`/notes/${nonExistentId}`, {
      method: "GET",
    });
    expect(response.status).toBe(404);
  });

  it("POST /notes - should return 400 if request body is invalid", async () => {
    mockValidateFactory.mockImplementation((config: any) => {
      if (config.source === "body" && config.varKey === "validatedBody") {
        // This console.log should now appear as expected
        console.log(
          "Mock validateFactory for 400 test: Simulating body validation error",
        );
        return vi.fn(async (c: any, next: Next) => {
          throw new BadRequestError();
        });
      }
      // Fallback for other validation steps (params, query) if any in the same route setup
      // This is important if a route has multiple validation middlewares.
      return vi.fn(async (c: any, next: Next) => await next());
    });

    // Set up routes AFTER specific mock implementation is in place
    setupRoutes();

    const response = await app.request("/notes", {
      method: "POST",
      body: JSON.stringify({}), // Empty/invalid body
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(400);
  });

  it("GET /notes/:id - should return 401 if user is not authenticated", async () => {
    mockAuthMiddleware.mockImplementationOnce(async (c: any, next: Next) => {
      console.log(
        "Mock authMiddleware for 401 test: Simulating UnauthenticatedError",
      );
      throw new UnauthenticatedError("Authentication required.");
    });

    setupRoutes(); // Set up routes AFTER specific mock implementation is in place

    const response = await app.request("/notes/some-note-id", {
      method: "GET",
    });

    expect(response.status).toBe(401);
    const responseBody = await response.json();
    expect(responseBody.error).toBe("Authentication required.");
  });

  it("PUT /notes/:id - should return 403 if user tries to update another user\'s note", async () => {
    setupRoutes(); // Standard setup, auth middleware will set testUser
    const otherUsersNote = await mockDbRepo.create(
      { content: "Other user\'s note" },
      otherTestUser.userId,
    );

    const updatePayload: UpdateNoteType = { content: "Attempted update" };
    const response = await app.request(`/notes/${otherUsersNote.id}`, {
      method: "PUT",
      body: JSON.stringify(updatePayload),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(403);
  });

  it("DELETE /notes/:id - should return 403 if user tries to delete another user\'s note", async () => {
    setupRoutes(); // Standard setup, auth middleware will set testUser
    const otherUsersNote = await mockDbRepo.create(
      { content: "Another note by other user" },
      otherTestUser.userId,
    );

    const response = await app.request(`/notes/${otherUsersNote.id}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(403);
  });
});
