import type { Context } from "hono";
import type { NoteService } from "@/services/note.service.ts";
import type {
  EntityIdParamType,
  QueryParamsType,
} from "@/schemas/shared.schema.ts";
import type { CreateNoteType, UpdateNoteType } from "@/schemas/note.schema.ts";
import type { AppEnv } from "@/schemas/app-env.schema.ts";

export class NoteController {
  private noteService: NoteService;

  constructor(noteService: NoteService) {
    this.noteService = noteService;
  }

  getAll = async (c: Context<AppEnv>): Promise<Response> => {
    const query = c.var.validatedQuery as QueryParamsType;
    const notes = await this.noteService.getAllNotes(query);
    return c.json(notes);
  };

  getById = async (c: Context<AppEnv>): Promise<Response> => {
    const { id } = c.var.validatedParams as EntityIdParamType;
    const note = await this.noteService.getById(id);

    if (!note) {
      return c.json({ message: "Note not found" }, 404);
    }

    return c.json(note);
  };

  create = async (c: Context<AppEnv>): Promise<Response> => {
    const body = c.var.validatedBody as CreateNoteType;
    const note = await this.noteService.create(body);
    return c.json(note);
  };

  update = async (c: Context<AppEnv>): Promise<Response> => {
    const { id } = c.var.validatedParams as EntityIdParamType;
    const body = c.var.validatedBody as UpdateNoteType;
    const note = await this.noteService.update(id, body);

    if (!note) {
      return c.json({ message: "Note not found" }, 404);
    }

    return c.json(note);
  };

  delete = async (c: Context<AppEnv>): Promise<Response> => {
    const { id } = c.var.validatedParams as EntityIdParamType;
    const success = await this.noteService.delete(id);

    if (!success) {
      return c.json({ message: "Note not found" }, 404);
    }

    return c.json({ message: "Note deleted successfully" });
  };
}
