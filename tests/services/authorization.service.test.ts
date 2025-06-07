import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AuthorizationService } from "@/services/authorization.service";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";
import type { NoteType } from "@/schemas/note.schema";

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

const mockNoteOwnedByRegularUser: NoteType = {
  id: "note-1",
  content: "Test content",
  createdBy: regularUser.userId,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockNoteOwnedByOtherUser: NoteType = {
  id: "note-2",
  content: "Other user's content",
  createdBy: otherUser.userId,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const findAll = vi.fn();
const findById = vi.fn();
const findAllByIds = vi.fn();
const create = vi.fn();
const update = vi.fn();
const remove = vi.fn();
const NoteRepositoryMock = vi.fn(() => ({
  findAll,
  findById,
  findAllByIds,
  create,
  update,
  delete: remove,
}));

describe("AuthorizationService", () => {
  let service: AuthorizationService;

  beforeEach(() => {
    service = new AuthorizationService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("isAdmin", () => {
    it("returns true for admin", () => {
      expect(service.isAdmin(adminUser)).toBe(true);
    });
    it("returns false for regular user", () => {
      expect(service.isAdmin(regularUser)).toBe(false);
    });
  });

  describe("canViewNote", () => {
    it("allows admin", async () => {
      await expect(
        service.canViewNote(adminUser, mockNoteOwnedByRegularUser),
      ).resolves.toBe(true);
    });
    it("allows owner", async () => {
      await expect(
        service.canViewNote(regularUser, mockNoteOwnedByRegularUser),
      ).resolves.toBe(true);
    });
    it("denies non-owner", async () => {
      await expect(
        service.canViewNote(regularUser, mockNoteOwnedByOtherUser),
      ).resolves.toBe(false);
    });
  });

  describe("canCreateNote", () => {
    it("allows admin", async () => {
      await expect(service.canCreateNote(adminUser)).resolves.toBe(true);
    });
    it("allows regular user", async () => {
      await expect(service.canCreateNote(regularUser)).resolves.toBe(true);
    });
  });

  describe("canUpdateNote", () => {
    it("allows admin", async () => {
      await expect(
        service.canUpdateNote(adminUser, mockNoteOwnedByRegularUser),
      ).resolves.toBe(true);
    });
    it("allows owner", async () => {
      await expect(
        service.canUpdateNote(regularUser, mockNoteOwnedByRegularUser),
      ).resolves.toBe(true);
    });
    it("denies non-owner", async () => {
      await expect(
        service.canUpdateNote(regularUser, mockNoteOwnedByOtherUser),
      ).resolves.toBe(false);
    });
  });

  describe("canDeleteNote", () => {
    it("allows admin", async () => {
      await expect(
        service.canDeleteNote(adminUser, mockNoteOwnedByRegularUser),
      ).resolves.toBe(true);
    });
    it("allows owner", async () => {
      await expect(
        service.canDeleteNote(regularUser, mockNoteOwnedByRegularUser),
      ).resolves.toBe(true);
    });
    it("denies non-owner", async () => {
      await expect(
        service.canDeleteNote(regularUser, mockNoteOwnedByOtherUser),
      ).resolves.toBe(false);
    });
  });

  describe("canReceiveNoteEvent", () => {
    it("allows admin to receive any note event", async () => {
      const noteData = { createdBy: "other-user", content: "Test note" };
      await expect(
        service.canReceiveNoteEvent(adminUser, noteData),
      ).resolves.toBe(true);
    });

    it("allows owner to receive their note events", async () => {
      const noteData = { createdBy: regularUser.userId, content: "Test note" };
      await expect(
        service.canReceiveNoteEvent(regularUser, noteData),
      ).resolves.toBe(true);
    });

    it("denies non-owner from receiving other users' note events", async () => {
      const noteData = { createdBy: otherUser.userId, content: "Test note" };
      await expect(
        service.canReceiveNoteEvent(regularUser, noteData),
      ).resolves.toBe(false);
    });
  });
});
