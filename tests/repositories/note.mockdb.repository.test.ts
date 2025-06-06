import { describe, it, expect, beforeEach } from "vitest";
import { MockDbNoteRepository } from "@/repositories/mockdb/note.mockdb.repository";
import type { CreateNoteType } from "@/schemas/note.schema";

const userId = "user-1";
const otherUserId = "user-2";

describe("MockDbNoteRepository", () => {
  let repo: MockDbNoteRepository;

  beforeEach(() => {
    repo = new MockDbNoteRepository();
    repo.clear();
  });

  describe("create", () => {
    it("creates a note and returns it", async () => {
      const data: CreateNoteType = { content: "Test note" };
      const note = await repo.create(data, userId);
      expect(note.id).toBeDefined();
      expect(note.content).toBe("Test note");
      expect(note.createdBy).toBe(userId);
      expect(note.createdAt).toBeInstanceOf(Date);
      expect(note.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("findAll", () => {
    beforeEach(async () => {
      await repo.create({ content: "A" }, userId);
      await repo.create({ content: "B" }, userId);
      await repo.create({ content: "C" }, otherUserId);
    });
    it("returns all notes", async () => {
      const result = await repo.findAll({});
      expect(result.data.length).toBe(3);
    });
    it("filters by createdBy", async () => {
      const result = await repo.findAll({ createdBy: userId });
      expect(result.data.length).toBe(2);
      expect(result.data.every((n) => n.createdBy === userId)).toBe(true);
    });
    it("searches by content", async () => {
      const result = await repo.findAll({ search: "B" });
      expect(result.data.length).toBe(1);
      expect(result.data[0].content).toBe("B");
    });
    it("paginates results", async () => {
      const result = await repo.findAll({ page: 2, limit: 2 });
      expect(result.data.length).toBe(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
    });
    it("sorts results", async () => {
      const result = await repo.findAll({
        sortBy: "content",
        sortOrder: "desc",
      });
      expect(result.data[0].content >= result.data[1].content).toBe(true);
    });
  });

  describe("findById", () => {
    it("returns note by id", async () => {
      const note = await repo.create({ content: "Find me" }, userId);
      await repo.create({ content: "Distraction" }, userId);
      await repo.create({ content: "Distraction" }, userId);
      const found = await repo.findById(note.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(note.id);
    });
    it("returns null if not found", async () => {
      const found = await repo.findById("not-exist");
      expect(found).toBeNull();
    });
  });

  describe("findAllByIds", () => {
    it("returns only notes with given ids", async () => {
      const n1 = await repo.create({ content: "1" }, userId);
      await repo.create({ content: "2" }, userId);
      const n3 = await repo.create({ content: "3" }, userId);
      const result = await repo.findAllByIds([n1.id, n3.id], {});
      expect(result.data.length).toBe(2);
      expect(result.data.map((n) => n.id).sort()).toEqual(
        [n1.id, n3.id].sort(),
      );
    });
  });

  describe("update", () => {
    it("updates note fields", async () => {
      const note = await repo.create({ content: "Old" }, userId);
      // wait for a bit to ensure updatedAt changes
      await new Promise((resolve) => setTimeout(resolve, 100));
      const updated = await repo.update(note.id, { content: "New" });
      expect(updated).not.toBeNull();
      expect(updated!.content).toBe("New");
      expect(updated!.updatedAt).not.toEqual(note.updatedAt);
    });
    it("returns null if note does not exist", async () => {
      const updated = await repo.update("not-exist", { content: "X" });
      expect(updated).toBeNull();
    });
  });

  describe("delete", () => {
    it("deletes note and returns true", async () => {
      const note = await repo.create({ content: "Del" }, userId);
      const result = await repo.remove(note.id);
      expect(result).toBe(true);
      const found = await repo.findById(note.id);
      expect(found).toBeNull();
    });
    it("returns false if note does not exist", async () => {
      const result = await repo.remove("not-exist");
      expect(result).toBe(false);
    });
  });
});
