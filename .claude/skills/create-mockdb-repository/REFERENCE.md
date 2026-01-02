# MockDB Repository Reference Implementation

Complete implementation example for a MockDB (in-memory) repository.

## Full Example: `note.mockdb.repository.ts`

```typescript
import { v4 as uuidv4 } from "uuid";
import type {
  NoteType,
  CreateNoteType,
  UpdateNoteType,
  NoteQueryParamsType,
  NoteIdType,
} from "@/schemas/note.schema";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  type PaginatedResultType,
} from "@/schemas/shared.schema";
import type { INoteRepository } from "@/repositories/note.repository";
import type { UserIdType } from "@/schemas/user.schemas";

export class MockDbNoteRepository implements INoteRepository {
  private notes: NoteType[] = [];

  private applyQueryParams(
    notes: NoteType[],
    params: NoteQueryParamsType,
  ): PaginatedResultType<NoteType> {
    let filteredNotes = notes;

    // Filter by createdBy
    const createdBy = params.createdBy;
    if (createdBy) {
      filteredNotes = filteredNotes.filter(
        (note) => note.createdBy === createdBy,
      );
    }

    // Search filter
    const searchTerm = params.search?.toLowerCase().trim();
    if (searchTerm) {
      filteredNotes = filteredNotes.filter((note) =>
        note.content.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Pagination
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    let paginatedNotes = filteredNotes.slice(skip, skip + limit);
    const totalPages = Math.ceil(filteredNotes.length / limit);

    // Sorting
    const sortBy = (params.sortBy ?? "createdAt") as keyof NoteType;
    const sortOrder = params.sortOrder;
    if (sortBy) {
      paginatedNotes = paginatedNotes.sort((a, b) => {
        if (sortOrder === "asc") {
          return (
            a[sortBy]?.toString().localeCompare(b[sortBy]?.toString() ?? "") ??
            0
          );
        } else if (sortOrder === "desc") {
          return (
            b[sortBy]?.toString().localeCompare(a[sortBy]?.toString() ?? "") ??
            0
          );
        }
        return 0;
      });
    }

    return {
      data: paginatedNotes,
      total: filteredNotes.length,
      page,
      limit,
      totalPages,
    };
  }

  async findAll(
    params: NoteQueryParamsType,
  ): Promise<PaginatedResultType<NoteType>> {
    return this.applyQueryParams(this.notes, params);
  }

  async findById(id: string): Promise<NoteType | null> {
    const note = this.notes.find((n) => n.id === id);
    return note || null;
  }

  async create(
    data: CreateNoteType,
    createdByUserId: UserIdType,
  ): Promise<NoteType> {
    const now = new Date();
    const newNote: NoteType = {
      id: uuidv4(),
      ...data,
      createdBy: createdByUserId,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.push(newNote);
    return newNote;
  }

  async update(id: NoteIdType, data: UpdateNoteType): Promise<NoteType | null> {
    const noteIndex = this.notes.findIndex((n) => n.id === id);
    if (noteIndex === -1) {
      return null;
    }
    const existingNote = this.notes[noteIndex];
    const updatedNote = {
      ...existingNote,
      ...data,
      updatedAt: new Date(),
    };
    this.notes[noteIndex] = updatedNote;
    return updatedNote;
  }

  async remove(id: NoteIdType): Promise<boolean> {
    const initialLength = this.notes.length;
    this.notes = this.notes.filter((n) => n.id !== id);
    return this.notes.length < initialLength;
  }

  // Helper method for testing: clear all notes
  clear(): void {
    this.notes = [];
  }
}
```

## Custom Method Example: `findAllByIds`

If your interface requires batch fetching by IDs:

```typescript
async findAllByIds(
  ids: NoteIdType[],
  params: NoteQueryParamsType
): Promise<PaginatedResultType<NoteType>> {
  const filteredNotes = this.notes.filter((note) => ids.includes(note.id));
  return this.applyQueryParams(filteredNotes, params);
}
```

## Usage in Tests

```typescript
import { MockDbNoteRepository } from "@/repositories/mockdb/note.mockdb.repository";

describe("NoteService", () => {
  let repository: MockDbNoteRepository;

  beforeEach(() => {
    repository = new MockDbNoteRepository();
  });

  afterEach(() => {
    repository.clear(); // Clean up after each test
  });

  it("should create a note", async () => {
    const note = await repository.create({ content: "Test note" }, "user-123");
    expect(note.id).toBeDefined();
    expect(note.content).toBe("Test note");
    expect(note.createdBy).toBe("user-123");
  });
});
```
