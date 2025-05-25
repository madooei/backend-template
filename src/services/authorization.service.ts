import type { INoteRepository } from "@/repositories/note.repository.ts";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas.ts";
import type { NoteType } from "@/schemas/note.schema.ts";

export class AuthorizationService {
  private noteRepository: INoteRepository;

  constructor(noteRepository: INoteRepository) {
    this.noteRepository = noteRepository;
  }

  isAdmin(user: AuthenticatedUserContextType): boolean {
    return user.globalRole === "admin";
  }

  // --- Note Permissions ---

  async canViewNote(
    user: AuthenticatedUserContextType,
    note: NoteType,
  ): Promise<boolean> {
    if (this.isAdmin(user)) return true;
    if (note.createdBy === user.userId) return true;

    return false;
  }

  async canCreateNote(user: AuthenticatedUserContextType): Promise<boolean> {
    if (this.isAdmin(user)) return true;
    if (user.globalRole === "user") return true;
    return false;
  }

  async canUpdateNote(
    user: AuthenticatedUserContextType,
    note: NoteType,
  ): Promise<boolean> {
    if (this.isAdmin(user)) return true;
    if (note.createdBy === user.userId) return true;

    return false;
  }

  async canDeleteNote(
    user: AuthenticatedUserContextType,
    note: NoteType,
  ): Promise<boolean> {
    if (this.isAdmin(user)) return true;
    if (note.createdBy === user.userId) return true;

    return false;
  }

  // --- Add More Permissions Here ---
}
