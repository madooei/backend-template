import type { INoteRepository } from "@/repositories/note.repository.ts";
import type { PaginatedResult } from "@/schemas/shared.schema.ts";
import type {
  CreateNoteDto,
  Note,
  UpdateNoteDto,
} from "@/schemas/note.schema.ts";
import type { QueryParams } from "@/schemas/shared.schema.ts";

export class NoteService {
  private readonly noteRepository: INoteRepository;

  constructor(noteRepository: INoteRepository) {
    this.noteRepository = noteRepository;
  }

  async getAllNotes(params: QueryParams): Promise<PaginatedResult<Note>> {
    return this.noteRepository.findAll(params);
  }

  async getById(id: string): Promise<Note | null> {
    return this.noteRepository.findById(id);
  }

  async create(data: CreateNoteDto): Promise<Note> {
    return this.noteRepository.create(data);
  }

  async update(id: string, data: UpdateNoteDto): Promise<Note | null> {
    return this.noteRepository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.noteRepository.delete(id);
  }
}
