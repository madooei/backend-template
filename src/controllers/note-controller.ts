import type { Context } from "hono";
import type { NoteService } from "@/services/note.service.ts";
import { queryParamsSchema } from "@/schemas/shared.schema.ts";
import { createNoteSchema, updateNoteSchema } from "@/schemas/note.schema.ts";

export class NoteController {
  private noteService: NoteService;

  constructor(noteService: NoteService) {
    this.noteService = noteService;
  }

  getAll = async (c: Context): Promise<Response> => {
    const query = c.req.query();
    const result = queryParamsSchema.safeParse(query);

    if (!result.success) {
      return c.json(
        {
          message: "Invalid query parameters",
          cause: result.error.flatten(),
        },
        400,
      );
    }

    const notes = await this.noteService.getAllNotes(result.data);
    return c.json(notes);
  };

  getById = async (c: Context): Promise<Response> => {
    const { id } = c.req.param();
    const note = await this.noteService.getById(id);

    if (!note) {
      return c.json(
        { message: "Note not found" },
        404,
      );
    }

    return c.json(note);
  };

  create = async (c: Context): Promise<Response> => {
    const body = await c.req.json();
    const result = createNoteSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        { message: "Invalid request body", cause: result.error.flatten() },
        400,
      );
    }

    const note = await this.noteService.create(result.data);
    return c.json(note);
  };

  update = async (c: Context): Promise<Response> => {
    const { id } = c.req.param();
    const body = await c.req.json();
    const result = updateNoteSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        { message: "Invalid request body", cause: result.error.flatten() },
        400,
      );
    }

    const note = await this.noteService.update(id, result.data);

    if (!note) {
      return c.json(
        { message: "Note not found" },
        404,
      );
    }

    return c.json(note);
  };

  delete = async (c: Context): Promise<Response> => {
    const { id } = c.req.param();
    const success = await this.noteService.delete(id);

    if (!success) {
      return c.json(
        { message: "Note not found" },
        404,
      );
    }

    return c.json({ message: "Note deleted successfully" });
  };
}
