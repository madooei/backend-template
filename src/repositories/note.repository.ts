import type {
  NoteType,
  CreateNoteType,
  UpdateNoteType,
} from "@/schemas/note.schema.ts";
import type {
  QueryParamsType,
  PaginatedResultType,
} from "@/schemas/shared.schema.ts";

export interface INoteRepository {
  findAll(params: QueryParamsType): Promise<PaginatedResultType<NoteType>>;
  findById(id: string): Promise<NoteType | null>;
  findAllByIds(
    ids: string[],
    params: QueryParamsType,
  ): Promise<PaginatedResultType<NoteType>>;
  create(data: CreateNoteType): Promise<NoteType>;
  update(id: string, data: UpdateNoteType): Promise<NoteType | null>;
  delete(id: string): Promise<boolean>;
}
