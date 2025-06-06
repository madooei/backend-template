import type { INoteRepository } from "@/repositories/note.repository";
import type { PaginatedResultType } from "@/schemas/shared.schema";
import type {
  CreateNoteType,
  NoteQueryParamsType,
  NoteType,
  UpdateNoteType,
} from "@/schemas/note.schema";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";
import { AuthorizationService } from "@/services/authorization.service";
import { UnauthorizedError } from "@/errors";
import { MockDbNoteRepository } from "@/repositories/mockdb/note.mockdb.repository";

export class NoteService {
  private readonly noteRepository: INoteRepository;
  private readonly authorizationService: AuthorizationService;

  constructor(
    noteRepository?: INoteRepository,
    authorizationService?: AuthorizationService,
  ) {
    if (noteRepository) {
      this.noteRepository = noteRepository;
    } else {
      this.noteRepository = new MockDbNoteRepository();
    }

    if (authorizationService) {
      this.authorizationService = authorizationService;
    } else {
      this.authorizationService = new AuthorizationService();
    }
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
    if (!canView) throw new UnauthorizedError();

    return note;
  }

  async create(
    data: CreateNoteType,
    user: AuthenticatedUserContextType,
  ): Promise<NoteType> {
    const canCreate = await this.authorizationService.canCreateNote(user);
    if (!canCreate) throw new UnauthorizedError();

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
    if (!canUpdate) throw new UnauthorizedError();

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
    if (!canDelete) throw new UnauthorizedError();

    return this.noteRepository.remove(id);
  }
}
