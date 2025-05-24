import type { INoteRepository } from "@/repositories/note.repository.ts";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas.ts";

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
    noteId: string,
  ): Promise<boolean> {
    if (this.isAdmin(user)) return true;

    const note = await this.noteRepository.findById(noteId);
    if (!note) return false;
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
    noteId: string,
  ): Promise<boolean> {
    if (this.isAdmin(user)) return true;

    const note = await this.noteRepository.findById(noteId);
    if (!note) return false;

    if (note.createdBy === user.userId) return true;

    return false;
  }

  async canDeleteNote(
    user: AuthenticatedUserContextType,
    noteId: string,
  ): Promise<boolean> {
    if (this.isAdmin(user)) return true;

    const note = await this.noteRepository.findById(noteId);
    if (!note) return false;

    if (note.createdBy === user.userId) return true;

    return false;
  }

  // --- Add More Permissions Here ---
}
