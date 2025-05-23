import type { INoteRepository } from "@/repositories/note.repository.ts";
import type { PaginatedResultType } from "@/schemas/shared.schema.ts";
import type {
  CreateNoteType,
  NoteQueryParamsType,
  NoteType,
  UpdateNoteType,
} from "@/schemas/note.schema.ts";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas.ts";

export class NoteService {
  private readonly noteRepository: INoteRepository;

  constructor(noteRepository: INoteRepository) {
    this.noteRepository = noteRepository;
  }

  async getAll(
    params: NoteQueryParamsType,
    user: AuthenticatedUserContextType
  ): Promise<PaginatedResultType<NoteType>> {
    // TODO: Implement authorization logic here, in the next PR
    return this.noteRepository.findAll(params);
  }

  async getById(
    id: string,
    user: AuthenticatedUserContextType
  ): Promise<NoteType | null> {
    // TODO: Implement authorization logic here, in the next PR
    return this.noteRepository.findById(id);
  }

  async create(
    data: CreateNoteType,
    user: AuthenticatedUserContextType
  ): Promise<NoteType> {
    return this.noteRepository.create(data, user.userId);
  }

  async update(
    id: string,
    data: UpdateNoteType,
    user: AuthenticatedUserContextType
  ): Promise<NoteType | null> {
    // TODO: Implement authorization logic here, in the next PR
    return this.noteRepository.update(id, data);
  }

  async delete(
    id: string,
    user: AuthenticatedUserContextType
  ): Promise<boolean> {
    // TODO: Implement authorization logic here, in the next PR
    return this.noteRepository.delete(id);
  }
}
