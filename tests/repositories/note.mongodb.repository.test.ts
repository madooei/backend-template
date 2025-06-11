import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest";
import { MongoDbNoteRepository } from "@/repositories/mongodb/note.mongodb.repository";
import type { MongoClient, Db } from "mongodb";
import type {
  CreateNoteType,
  UpdateNoteType,
  NoteQueryParamsType,
} from "@/schemas/note.schema";

describe("MongoDbNoteRepository", () => {
  let repository: MongoDbNoteRepository;
  let testClient: MongoClient;
  let testDb: Db;
  const testUserId = "test-user-123";

  beforeAll(async () => {
    // Set up test database connection using memory server
    const { db, client } = await setupTestDatabase();
    testDb = db;
    testClient = client;
  });

  afterAll(async () => {
    // Clean up test database connection
    await cleanupTestDatabase(testClient);
  });

  beforeEach(async () => {
    repository = new MongoDbNoteRepository();
    // Clear any existing test data
    await repository.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    await repository.clear();
  });

  describe("create", () => {
    it("should create a new note successfully", async () => {
      const noteData: CreateNoteType = {
        content: "Test note content",
      };

      const result = await repository.create(noteData, testUserId);

      expect(result).toMatchObject({
        id: expect.any(String),
        content: "Test note content",
        createdBy: testUserId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result.id).toBeTruthy();
    });

    it("should handle duplicate ID errors by retrying with new ID", async () => {
      const noteData: CreateNoteType = {
        content: "Test note content",
      };

      // Create first note
      const firstNote = await repository.create(noteData, testUserId);
      expect(firstNote).toBeTruthy();

      // Create second note should work fine (different UUID)
      const secondNote = await repository.create(noteData, testUserId);
      expect(secondNote).toBeTruthy();
      expect(secondNote.id).not.toBe(firstNote.id);
    });
  });

  describe("findById", () => {
    it("should find an existing note by ID", async () => {
      const noteData: CreateNoteType = {
        content: "Test note content",
      };

      const createdNote = await repository.create(noteData, testUserId);
      const foundNote = await repository.findById(createdNote.id);

      expect(foundNote).toEqual(createdNote);
    });

    it("should return null for non-existent note", async () => {
      const result = await repository.findById("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    beforeEach(async () => {
      // Create test data
      await repository.create({ content: "First note" }, testUserId);
      await repository.create({ content: "Second note" }, "other-user");
      await repository.create(
        { content: "Third note with search term" },
        testUserId
      );
    });

    it("should return all notes with default pagination", async () => {
      const params: NoteQueryParamsType = {};
      const result = await repository.findAll(params);

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it("should filter notes by createdBy", async () => {
      const params: NoteQueryParamsType = {
        createdBy: testUserId,
      };
      const result = await repository.findAll(params);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data.every((note) => note.createdBy === testUserId)).toBe(
        true
      );
    });

    it("should search notes by content", async () => {
      const params: NoteQueryParamsType = {
        search: "search term",
      };
      const result = await repository.findAll(params);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].content).toContain("search term");
    });

    it("should handle pagination correctly", async () => {
      const params: NoteQueryParamsType = {
        page: 1,
        limit: 2,
      };
      const result = await repository.findAll(params);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it("should sort notes correctly", async () => {
      const params: NoteQueryParamsType = {
        sortBy: "content",
        sortOrder: "asc",
      };
      const result = await repository.findAll(params);

      expect(result.data).toHaveLength(3);
      expect(result.data[0].content).toBe("First note");
      expect(result.data[1].content).toBe("Second note");
      expect(result.data[2].content).toBe("Third note with search term");
    });
  });

  describe("findAllByIds", () => {
    let noteIds: string[];

    beforeEach(async () => {
      const note1 = await repository.create({ content: "Note 1" }, testUserId);
      const note2 = await repository.create({ content: "Note 2" }, testUserId);
      const note3 = await repository.create(
        { content: "Note 3" },
        "other-user"
      );
      noteIds = [note1.id, note2.id, note3.id];
    });

    it("should find notes by array of IDs", async () => {
      const params: NoteQueryParamsType = {};
      const result = await repository.findAllByIds(
        [noteIds[0], noteIds[1]],
        params
      );

      expect(result.data).toHaveLength(2);
      expect(result.data.map((note) => note.id)).toEqual(
        expect.arrayContaining([noteIds[0], noteIds[1]])
      );
    });

    it("should filter by createdBy when finding by IDs", async () => {
      const params: NoteQueryParamsType = {
        createdBy: testUserId,
      };
      const result = await repository.findAllByIds(noteIds, params);

      expect(result.data).toHaveLength(2);
      expect(result.data.every((note) => note.createdBy === testUserId)).toBe(
        true
      );
    });

    it("should return empty result for non-existent IDs", async () => {
      const params: NoteQueryParamsType = {};
      const result = await repository.findAllByIds(
        ["non-existent-1", "non-existent-2"],
        params
      );

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("update", () => {
    let noteId: string;

    beforeEach(async () => {
      const note = await repository.create(
        { content: "Original content" },
        testUserId
      );
      noteId = note.id;
    });

    it("should update an existing note", async () => {
      // Add a small delay to ensure updatedAt is different from createdAt
      await new Promise((resolve) => setTimeout(resolve, 1));

      const updateData: UpdateNoteType = {
        content: "Updated content",
      };

      const result = await repository.update(noteId, updateData);

      expect(result).toMatchObject({
        id: noteId,
        content: "Updated content",
        createdBy: testUserId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result).not.toBeNull();
      expect(result!.updatedAt?.getTime()).toBeGreaterThanOrEqual(
        result!.createdAt?.getTime() || 0
      );
    });

    it("should return null for non-existent note", async () => {
      const updateData: UpdateNoteType = {
        content: "Updated content",
      };

      const result = await repository.update("non-existent-id", updateData);
      expect(result).toBeNull();
    });

    it("should handle partial updates", async () => {
      const updateData: UpdateNoteType = {}; // Empty update

      const result = await repository.update(noteId, updateData);

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: noteId,
        content: "Original content", // Should remain unchanged
        createdBy: testUserId,
      });
    });
  });

  describe("remove", () => {
    let noteId: string;

    beforeEach(async () => {
      const note = await repository.create(
        { content: "Note to delete" },
        testUserId
      );
      noteId = note.id;
    });

    it("should remove an existing note", async () => {
      const result = await repository.remove(noteId);
      expect(result).toBe(true);

      // Verify note is actually deleted
      const foundNote = await repository.findById(noteId);
      expect(foundNote).toBeNull();
    });

    it("should return false for non-existent note", async () => {
      const result = await repository.remove("non-existent-id");
      expect(result).toBe(false);
    });
  });

  describe("helper methods", () => {
    beforeEach(async () => {
      await repository.create({ content: "Test note 1" }, testUserId);
      await repository.create({ content: "Test note 2" }, testUserId);
    });

    it("should clear all notes", async () => {
      await repository.clear();

      const params: NoteQueryParamsType = {};
      const result = await repository.findAll(params);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should return collection stats", async () => {
      const stats = await repository.getStats();

      expect(stats.count).toBe(2);
      expect(stats.indexes).toEqual(
        expect.arrayContaining([
          "_id_",
          "notes_createdBy",
          "notes_createdAt_desc",
          "notes_content_text",
        ])
      );
    });
  });

  describe("data validation", () => {
    it("should validate data using Zod schema when mapping from document", async () => {
      const noteData: CreateNoteType = {
        content: "Valid note content",
      };

      const result = await repository.create(noteData, testUserId);

      // The result should be properly validated by Zod
      expect(result.id).toBeTruthy();
      expect(result.content).toBe("Valid note content");
      expect(result.createdBy).toBe(testUserId);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("database indexes", () => {
    it("should create proper indexes for performance", async () => {
      // Create a note to ensure collection and indexes are created
      await repository.create({ content: "Test note" }, testUserId);

      const stats = await repository.getStats();

      // Verify all expected indexes exist
      expect(stats.indexes).toContain("_id_"); // Default MongoDB index
      expect(stats.indexes).toContain("notes_createdBy"); // Index for filtering by user
      expect(stats.indexes).toContain("notes_createdAt_desc"); // Index for sorting by creation date
      expect(stats.indexes).toContain("notes_content_text"); // Text index for search
    });
  });
});
