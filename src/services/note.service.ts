import type { INoteRepository } from "@/repositories/note.repository.ts";
import type { PaginatedResultType } from "@/schemas/shared.schema.ts";
import type {
  CreateNoteType,
  NoteType,
  UpdateNoteType,
} from "@/schemas/note.schema.ts";
import type { QueryParamsType } from "@/schemas/shared.schema.ts";

export class NoteService {
  private readonly noteRepository: INoteRepository;

  constructor(noteRepository: INoteRepository) {
    this.noteRepository = noteRepository;
  }

  async getAllNotes(
    params: QueryParamsType,
  ): Promise<PaginatedResultType<NoteType>> {
    return this.noteRepository.findAll(params);
  }

  async getById(id: string): Promise<NoteType | null> {
    return this.noteRepository.findById(id);
  }

  async create(data: CreateNoteType): Promise<NoteType> {
    return this.noteRepository.create(data);
  }

  async update(id: string, data: UpdateNoteType): Promise<NoteType | null> {
    return this.noteRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.noteRepository.delete(id);
  }
}
