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
    user: AuthenticatedUserContextType
  ): Promise<PaginatedResultType<NoteType>> {
    if (this.authorizationService.isAdmin(user) {
      return this.noteRepository.findAll(params);
    }
    return this.noteRepository.findAll({ ...params, createdBy: user.userId });
  }

  async getById(
    id: string,
    user: AuthenticatedUserContextType
  ): Promise<NoteType | null> {
    if (!this.authorizationService.canViewNote(user, id)) {
      throw new UnauthenticatedError("Unauthorized to view note");
    }

    return this.noteRepository.findById(id);
  }

  async create(
    data: CreateNoteType,
    user: AuthenticatedUserContextType
  ): Promise<NoteType> {
    if (!this.authorizationService.canCreateNote(user)) {
      throw new UnauthenticatedError("Unauthorized to create note");
    }

    return this.noteRepository.create(data, user.userId);
  }

  async update(
    id: string,
    data: UpdateNoteType,
    user: AuthenticatedUserContextType
  ): Promise<NoteType | null> {
    if (!this.authorizationService.canUpdateNote(user, id)) {
      throw new UnauthenticatedError("Unauthorized to update note");
    }

    return this.noteRepository.update(id, data);
  }

  async delete(
    id: string,
    user: AuthenticatedUserContextType
  ): Promise<boolean> {
    if (!this.authorizationService.canDeleteNote(user, id)) {
      throw new UnauthenticatedError("Unauthorized to delete note");
    }

    return this.noteRepository.delete(id);
  }
}
