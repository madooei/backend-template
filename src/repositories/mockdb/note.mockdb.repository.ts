import { v4 as uuidv4 } from "uuid";
import type {
  Note,
  CreateNoteDto,
  UpdateNoteDto,
} from "@/schemas/note.schema.ts";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  type PaginatedResult,
  type QueryParams,
} from "@/schemas/shared.schema.ts";
import type { INoteRepository } from "@/repositories/note.repository.ts";

export class MockDbNoteRepository implements INoteRepository {
  private notes: Note[] = [];

  private applyQueryParams(
    notes: Note[],
    params: QueryParams,
  ): PaginatedResult<Note> {
    let filteredNotes = notes;

    const searchTerm = params.search?.toLowerCase().trim();
    if (searchTerm) {
      filteredNotes = filteredNotes.filter((note) =>
        note.content.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    let paginatedNotes = filteredNotes.slice(skip, skip + limit);
    const totalPages = Math.ceil(filteredNotes.length / limit);

    const sortBy = (params.sortBy ?? "createdAt") as keyof Note;
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

  async findAll(params: QueryParams): Promise<PaginatedResult<Note>> {
    return this.applyQueryParams(this.notes, params);
  }

  async findById(id: string): Promise<Note | null> {
    const note = this.notes.find((n) => n.id === id);
    return note || null;
  }

  async findAllByIds(
    ids: string[],
    params: QueryParams,
  ): Promise<PaginatedResult<Note>> {
    const filteredNotes = this.notes.filter((note) => ids.includes(note.id));

    return this.applyQueryParams(filteredNotes, params);
  }

  async create(data: CreateNoteDto): Promise<Note> {
    const now = new Date();
    const newNote: Note = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.push(newNote);
    return newNote;
  }

  async update(id: string, data: UpdateNoteDto): Promise<Note | null> {
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

  async delete(id: string): Promise<boolean> {
    const initialLength = this.notes.length;
    this.notes = this.notes.filter((n) => n.id !== id);
    return this.notes.length < initialLength;
  }

  // Helper method for testing: clear all notes
  clear(): void {
    this.notes = [];
  }
}
