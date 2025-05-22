import type {
  Note,
  CreateNoteDto,
  UpdateNoteDto,
} from "@/schemas/note.schema.ts";
import type { QueryParams, PaginatedResult } from "@/schemas/shared.schema.ts";

export interface INoteRepository {
  findAll(params: QueryParams): Promise<PaginatedResult<Note>>;
  findById(id: string): Promise<Note | null>;
  findAllByIds(
    ids: string[],
    params: QueryParams,
  ): Promise<PaginatedResult<Note>>;
  create(data: CreateNoteDto): Promise<Note>;
  update(id: string, data: UpdateNoteDto): Promise<Note | null>;
  delete(id: string): Promise<boolean>;
}
