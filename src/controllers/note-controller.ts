import type { Context } from "hono";
import type { NoteService } from "@/services/note.service.ts";
import type { EntityIdParamType } from "@/schemas/shared.schema.ts";
import type {
  CreateNoteType,
  NoteQueryParamsType,
  UpdateNoteType,
} from "@/schemas/note.schema.ts";
import type { AppEnv } from "@/schemas/app-env.schema.ts";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas.ts";

export class NoteController {
  private noteService: NoteService;

  constructor(noteService: NoteService) {
    this.noteService = noteService;
  }

  getAll = async (c: Context<AppEnv>): Promise<Response> => {
    const user = c.var.user as AuthenticatedUserContextType;
    const query = c.var.validatedQuery as NoteQueryParamsType;
    const notes = await this.noteService.getAll(query, user);
    return c.json(notes);
  };

  getById = async (c: Context<AppEnv>): Promise<Response> => {
    const user = c.var.user as AuthenticatedUserContextType;
    const { id } = c.var.validatedParams as EntityIdParamType;
    const note = await this.noteService.getById(id, user);

    if (!note) {
      return c.json({ message: "Note not found" }, 404);
    }

    return c.json(note);
  };

  create = async (c: Context<AppEnv>): Promise<Response> => {
    const user = c.var.user as AuthenticatedUserContextType;
    const body = c.var.validatedBody as CreateNoteType;
    const note = await this.noteService.create(body, user);
    return c.json(note);
  };

  update = async (c: Context<AppEnv>): Promise<Response> => {
    const user = c.var.user as AuthenticatedUserContextType;
    const { id } = c.var.validatedParams as EntityIdParamType;
    const body = c.var.validatedBody as UpdateNoteType;
    const note = await this.noteService.update(id, body, user);

    if (!note) {
      return c.json({ message: "Note not found" }, 404);
    }

    return c.json(note);
  };

  delete = async (c: Context<AppEnv>): Promise<Response> => {
    const user = c.var.user as AuthenticatedUserContextType;
    const { id } = c.var.validatedParams as EntityIdParamType;
    const success = await this.noteService.delete(id, user);

    if (!success) {
      return c.json({ message: "Note not found" }, 404);
    }

    return c.json({ message: "Note deleted successfully" });
  };
}
