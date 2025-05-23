import type {
  NoteType,
  CreateNoteType,
  UpdateNoteType,
  NoteQueryParamsType,
} from "@/schemas/note.schema.ts";
import type { PaginatedResultType } from "@/schemas/shared.schema.ts";

export interface INoteRepository {
  findAll(params: NoteQueryParamsType): Promise<PaginatedResultType<NoteType>>;
  findById(id: string): Promise<NoteType | null>;
  findAllByIds(
    ids: string[],
    params: NoteQueryParamsType
  ): Promise<PaginatedResultType<NoteType>>;
  create(data: CreateNoteType, createdByUserId: string): Promise<NoteType>;
  update(id: string, data: UpdateNoteType): Promise<NoteType | null>;
  delete(id: string): Promise<boolean>;
}
