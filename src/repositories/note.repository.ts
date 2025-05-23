import type {
  NoteType,
  CreateNoteType,
  UpdateNoteType,
  NoteQueryParamsType,
  NoteIdType,
} from "@/schemas/note.schema.ts";
import type { PaginatedResultType } from "@/schemas/shared.schema.ts";
import type { UserIdType } from "@/schemas/user.schemas.ts";

export interface INoteRepository {
  findAll(params: NoteQueryParamsType): Promise<PaginatedResultType<NoteType>>;
  findById(id: NoteIdType): Promise<NoteType | null>;
  findAllByIds(
    ids: NoteIdType[],
    params: NoteQueryParamsType
  ): Promise<PaginatedResultType<NoteType>>;
  create(data: CreateNoteType, createdByUserId: UserIdType): Promise<NoteType>;
  update(id: NoteIdType, data: UpdateNoteType): Promise<NoteType | null>;
  delete(id: NoteIdType): Promise<boolean>;
}
