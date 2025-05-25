import type { INoteRepository } from "@/repositories/note.repository.ts";
import type { PaginatedResultType } from "@/schemas/shared.schema.ts";
import type {
  CreateNoteType,
  NoteQueryParamsType,
  NoteType,
  UpdateNoteType,
} from "@/schemas/note.schema.ts";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas.ts";
import { AuthorizationService } from "@/services/authorization.service.ts";
import { UnauthenticatedError } from "@/errors/unauthenticated.error.ts";

export class NoteService {
  private readonly noteRepository: INoteRepository;
  private readonly authorizationService: AuthorizationService;

  constructor(noteRepository: INoteRepository) {
    this.noteRepository = noteRepository;
    this.authorizationService = new AuthorizationService(noteRepository);
  }

  async getAll(
    params: NoteQueryParamsType,
    user: AuthenticatedUserContextType,
  ): Promise<PaginatedResultType<NoteType>> {
    if (this.authorizationService.isAdmin(user)) {
      return this.noteRepository.findAll(params);
    }
    return this.noteRepository.findAll({ ...params, createdBy: user.userId });
  }

  async getById(
    id: string,
    user: AuthenticatedUserContextType,
  ): Promise<NoteType | null> {
    const note = await this.noteRepository.findById(id);
    if (!note) {
      return null;
    }

    const canView = await this.authorizationService.canViewNote(user, note);
    if (!canView) {
      throw new UnauthenticatedError("Unauthorized to view note");
    }

    return note;
  }

  async create(
    data: CreateNoteType,
    user: AuthenticatedUserContextType,
  ): Promise<NoteType> {
    const canCreate = await this.authorizationService.canCreateNote(user);
    if (!canCreate) {
      throw new UnauthenticatedError("Unauthorized to create note");
    }

    return this.noteRepository.create(data, user.userId);
  }

  async update(
    id: string,
    data: UpdateNoteType,
    user: AuthenticatedUserContextType,
  ): Promise<NoteType | null> {
    const note = await this.noteRepository.findById(id);
    if (!note) {
      return null;
    }

    const canUpdate = await this.authorizationService.canUpdateNote(user, note);
    if (!canUpdate) {
      throw new UnauthenticatedError("Unauthorized to update note");
    }

    return this.noteRepository.update(id, data);
  }

  async delete(
    id: string,
    user: AuthenticatedUserContextType,
  ): Promise<boolean> {
    const note = await this.noteRepository.findById(id);
    if (!note) {
      return false;
    }

    const canDelete = await this.authorizationService.canDeleteNote(user, note);
    if (!canDelete) {
      throw new UnauthenticatedError("Unauthorized to delete note");
    }

    return this.noteRepository.delete(id);
  }
}
