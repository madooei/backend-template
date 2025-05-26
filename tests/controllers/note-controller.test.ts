import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NoteController } from "@/controllers/note-controller.ts";
import type { NoteService } from "@/services/note.service.ts";
import type {
  CreateNoteType,
  UpdateNoteType,
  NoteQueryParamsType,
  NoteType,
} from "@/schemas/note.schema.ts";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas.ts";
import type {
  PaginatedResultType,
  EntityIdParamType,
} from "@/schemas/shared.schema.ts";
import { NotFoundError } from "@/errors.ts";

// Define an interface for the parameters of createMockContext for better type safety
interface MockContextConfig {
  user?: AuthenticatedUserContextType;
  validatedQuery?: NoteQueryParamsType;
  validatedParams?: EntityIdParamType; // Use EntityIdParamType as used in controller
  validatedBody?: CreateNoteType | UpdateNoteType;
}

const createMockContext = (config: MockContextConfig = {}) => {
  const mockJson = vi.fn((data) => data); // Mock c.json to return data for easier assertions
  return {
    var: {
      user: config.user || ({} as AuthenticatedUserContextType),
      validatedQuery: config.validatedQuery || ({} as NoteQueryParamsType),
      validatedParams: config.validatedParams || ({} as EntityIdParamType),
      validatedBody:
        config.validatedBody || ({} as CreateNoteType | UpdateNoteType),
    },
    json: mockJson,
    // Hono context can have other properties, but these are the ones used by the controller
  } as any; // Use 'as any' for simplicity, or a more complete Hono.Context mock
};

// Simpler mock object for NoteService
const mockNoteService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(), // Use 'delete' as the method name matches the service
};

describe("NoteController", () => {
  let controller: NoteController;
  let user: AuthenticatedUserContextType;
  // Define a sample note for reuse in tests
  let sampleNote: NoteType;

  beforeEach(() => {
    // Cast to unknown then to NoteService to satisfy TypeScript when using a simple object mock
    controller = new NoteController(mockNoteService as unknown as NoteService);
    user = { userId: "user-1", globalRole: "user" };
    sampleNote = {
      id: "note-1",
      content: "Test Note",
      createdBy: user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("returns notes from service and calls c.json with them", async () => {
      const query: NoteQueryParamsType = { page: 1, limit: 10 };
      const notesResult: PaginatedResultType<NoteType> = {
        data: [sampleNote],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockNoteService.getAll.mockResolvedValue(notesResult);

      const mockCtx = createMockContext({ user, validatedQuery: query });
      const response = await controller.getAll(mockCtx);

      expect(mockNoteService.getAll).toHaveBeenCalledWith(query, user);
      expect(mockCtx.json).toHaveBeenCalledWith(notesResult);
      expect(response).toEqual(notesResult); // Because our mock c.json returns the data
    });
  });

  describe("getById", () => {
    it("returns a note when found and calls c.json with it", async () => {
      const params: EntityIdParamType = { id: sampleNote.id };
      mockNoteService.getById.mockResolvedValue(sampleNote);

      const mockCtx = createMockContext({ user, validatedParams: params });
      const response = await controller.getById(mockCtx);

      expect(mockNoteService.getById).toHaveBeenCalledWith(params.id, user);
      expect(mockCtx.json).toHaveBeenCalledWith(sampleNote);
      expect(response).toEqual(sampleNote);
    });

    it("throws NotFoundHTTPException when note is not found", async () => {
      const params: EntityIdParamType = { id: "non-existent-id" };
      mockNoteService.getById.mockResolvedValue(null);
      const mockCtx = createMockContext({ user, validatedParams: params });
      await expect(controller.getById(mockCtx)).rejects.toThrow(NotFoundError);
      expect(mockNoteService.getById).toHaveBeenCalledWith(params.id, user);
      expect(mockCtx.json).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("creates a note and calls c.json with the created note", async () => {
      const createDto: CreateNoteType = { content: "New Note" };
      const createdNote: NoteType = {
        ...sampleNote,
        ...createDto,
        id: "new-id",
      };
      mockNoteService.create.mockResolvedValue(createdNote);

      const mockCtx = createMockContext({ user, validatedBody: createDto });
      const response = await controller.create(mockCtx);

      expect(mockNoteService.create).toHaveBeenCalledWith(createDto, user);
      expect(mockCtx.json).toHaveBeenCalledWith(createdNote);
      expect(response).toEqual(createdNote);
    });
  });

  describe("update", () => {
    it("updates a note and calls c.json with the updated note", async () => {
      const params: EntityIdParamType = { id: sampleNote.id };
      const updateDto: UpdateNoteType = { content: "Updated Content" };
      const updatedNote: NoteType = { ...sampleNote, ...updateDto };
      mockNoteService.update.mockResolvedValue(updatedNote);

      const mockCtx = createMockContext({
        user,
        validatedParams: params,
        validatedBody: updateDto,
      });
      const response = await controller.update(mockCtx);

      expect(mockNoteService.update).toHaveBeenCalledWith(
        params.id,
        updateDto,
        user,
      );
      expect(mockCtx.json).toHaveBeenCalledWith(updatedNote);
      expect(response).toEqual(updatedNote);
    });

    it("throws NotFoundHTTPException when note to update is not found", async () => {
      const params: EntityIdParamType = { id: "non-existent-id" };
      const updateDto: UpdateNoteType = { content: "Updated Content" };
      mockNoteService.update.mockResolvedValue(null);

      const mockCtx = createMockContext({
        user,
        validatedParams: params,
        validatedBody: updateDto,
      });

      await expect(controller.update(mockCtx)).rejects.toThrow(NotFoundError);
      expect(mockNoteService.update).toHaveBeenCalledWith(
        params.id,
        updateDto,
        user,
      );
      expect(mockCtx.json).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deletes a note and calls c.json with a success message", async () => {
      const params: EntityIdParamType = { id: sampleNote.id };
      mockNoteService.delete.mockResolvedValue(true); // Service returns true for success

      const mockCtx = createMockContext({ user, validatedParams: params });
      const response = await controller.delete(mockCtx);
      const expectedResponse = { message: "Note deleted successfully" };

      expect(mockNoteService.delete).toHaveBeenCalledWith(params.id, user);
      expect(mockCtx.json).toHaveBeenCalledWith(expectedResponse);
      expect(response).toEqual(expectedResponse);
    });

    it("throws NotFoundHTTPException when note to delete is not found", async () => {
      const params: EntityIdParamType = { id: "non-existent-id" };
      mockNoteService.delete.mockResolvedValue(false); // Service returns false if not found/failed

      const mockCtx = createMockContext({ user, validatedParams: params });

      await expect(controller.delete(mockCtx)).rejects.toThrow(NotFoundError);
      expect(mockNoteService.delete).toHaveBeenCalledWith(params.id, user);
      expect(mockCtx.json).not.toHaveBeenCalled();
    });
  });
});
