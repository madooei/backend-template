import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";
import type { NoteType } from "@/schemas/note.schema";

export class AuthorizationService {
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

  // --- Event Permissions ---

  async canReceiveNoteEvent(
    user: AuthenticatedUserContextType,
    noteData: { createdBy: string; [key: string]: unknown },
  ): Promise<boolean> {
    // Apply same rules as viewing notes
    if (this.isAdmin(user)) return true;
    if (noteData.createdBy === user.userId) return true;
    return false;
  }

  // --- Add More Permissions Here ---
}
