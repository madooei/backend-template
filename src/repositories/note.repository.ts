import type {
  NoteType,
  CreateNoteType,
  UpdateNoteType,
  NoteQueryParamsType,
  NoteIdType,
} from "@/schemas/note.schema";
import type { PaginatedResultType } from "@/schemas/shared.schema";
import type { UserIdType } from "@/schemas/user.schemas";

export interface INoteRepository {
  findAll(params: NoteQueryParamsType): Promise<PaginatedResultType<NoteType>>;
  findById(id: NoteIdType): Promise<NoteType | null>;
  findAllByIds(
    ids: NoteIdType[],
    params: NoteQueryParamsType,
  ): Promise<PaginatedResultType<NoteType>>;
  create(data: CreateNoteType, createdByUserId: UserIdType): Promise<NoteType>;
  update(id: NoteIdType, data: UpdateNoteType): Promise<NoteType | null>;
  remove(id: NoteIdType): Promise<boolean>;
}
