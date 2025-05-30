import { describe, it, expect, beforeEach } from "vitest";
import { NoteService } from "@/services/note.service.ts";
import { MockDbNoteRepository } from "@/repositories/mockdb/note.mockdb.repository.ts";
import type { CreateNoteType, NoteType } from "@/schemas/note.schema.ts";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas.ts";
import { UnauthorizedError } from "@/errors.ts";

const adminUser: AuthenticatedUserContextType = {
  userId: "admin-1",
  globalRole: "admin",
};
const regularUser: AuthenticatedUserContextType = {
  userId: "user-1",
  globalRole: "user",
};
const otherUser: AuthenticatedUserContextType = {
  userId: "user-2",
  globalRole: "user",
};

describe("NoteService", () => {
  let noteRepository: MockDbNoteRepository;
  let noteService: NoteService;

  beforeEach(() => {
    noteRepository = new MockDbNoteRepository();
    noteService = new NoteService(noteRepository);
    noteRepository.clear();
  });

  describe("create", () => {
    it("allows admin to create a note", async () => {
      const data: CreateNoteType = { content: "Admin note" };
      const note = await noteService.create(data, adminUser);
      expect(note.content).toBe("Admin note");
      expect(note.createdBy).toBe(adminUser.userId);
    });
    it("allows regular user to create a note", async () => {
      const data: CreateNoteType = { content: "User note" };
      const note = await noteService.create(data, regularUser);
      expect(note.content).toBe("User note");
      expect(note.createdBy).toBe(regularUser.userId);
    });
  });

  describe("getAll", () => {
    beforeEach(async () => {
      await noteService.create({ content: "Note 1" }, regularUser);
      await noteService.create({ content: "Note 2" }, adminUser);
      await noteService.create({ content: "Note 3" }, regularUser);
    });
    it("returns all notes for admin", async () => {
      const result = await noteService.getAll({}, adminUser);
      expect(result.data.length).toBe(3);
    });
    it("returns only user's notes for regular user", async () => {
      const result = await noteService.getAll({}, regularUser);
      expect(result.data.length).toBe(2);
      expect(result.data.every((n) => n.createdBy === regularUser.userId)).toBe(
        true,
      );
    });
    it("supports search and pagination", async () => {
      const result = await noteService.getAll({ search: "Note 2" }, adminUser);
      expect(result.data.length).toBe(1);
      expect(result.data[0].content).toBe("Note 2");
    });
  });

  describe("getById", () => {
    let note: NoteType;
    beforeEach(async () => {
      note = await noteService.create({ content: "Secret" }, regularUser);
    });
    it("allows owner to get their note", async () => {
      const found = await noteService.getById(note.id, regularUser);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(note.id);
    });
    it("allows admin to get any note", async () => {
      const found = await noteService.getById(note.id, adminUser);
      expect(found).not.toBeNull();
    });
    it("denies other users", async () => {
      await expect(noteService.getById(note.id, otherUser)).rejects.toThrow(
        UnauthorizedError,
      );
    });
    it("returns null for non-existent note", async () => {
      await expect(
        noteService.getById("not-exist", adminUser),
      ).resolves.toBeNull();
    });
  });

  describe("update", () => {
    let note: NoteType;
    beforeEach(async () => {
      note = await noteService.create({ content: "Old" }, regularUser);
    });
    it("allows owner to update", async () => {
      const updated = await noteService.update(
        note.id,
        { content: "New" },
        regularUser,
      );
      expect(updated).not.toBeNull();
      expect(updated!.content).toBe("New");
    });
    it("allows admin to update", async () => {
      const updated = await noteService.update(
        note.id,
        { content: "Admin Edit" },
        adminUser,
      );
      expect(updated).not.toBeNull();
      expect(updated!.content).toBe("Admin Edit");
    });
    it("denies other users", async () => {
      await expect(
        noteService.update(note.id, { content: "Hack" }, otherUser),
      ).rejects.toThrow(UnauthorizedError);
    });
    it("returns null for non-existent note", async () => {
      await expect(
        noteService.update("not-exist", { content: "X" }, adminUser),
      ).resolves.toBeNull();
    });
  });

  describe("delete", () => {
    let note: NoteType;
    beforeEach(async () => {
      note = await noteService.create({ content: "To delete" }, regularUser);
    });
    it("allows owner to delete", async () => {
      const result = await noteService.delete(note.id, regularUser);
      expect(result).toBe(true);
    });
    it("allows admin to delete", async () => {
      const result = await noteService.delete(note.id, adminUser);
      expect(result).toBe(true);
    });
    it("denies other users", async () => {
      await expect(noteService.delete(note.id, otherUser)).rejects.toThrow(
        UnauthorizedError,
      );
    });
    it("returns false for non-existent note", async () => {
      await expect(noteService.delete("not-exist", adminUser)).resolves.toBe(
        false,
      );
    });
  });
});
