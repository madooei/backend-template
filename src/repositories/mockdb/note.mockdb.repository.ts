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

    const createdBy = params.createdBy;
    if (createdBy) {
      filteredNotes = filteredNotes.filter(
        (note) => note.createdBy === createdBy,
      );
    }

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

  async findAllByIds(
    ids: NoteIdType[],
    params: NoteQueryParamsType,
  ): Promise<PaginatedResultType<NoteType>> {
    const filteredNotes = this.notes.filter((note) => ids.includes(note.id));
    return this.applyQueryParams(filteredNotes, params);
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
