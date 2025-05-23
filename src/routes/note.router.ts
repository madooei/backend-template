import { Hono } from "hono";
import type { NoteController } from "@/controllers/note-controller.ts";

export const createNoteRoutes = (noteController: NoteController) => {
  const noteRoutes = new Hono();

  noteRoutes.get("/", noteController.getAll);
  noteRoutes.get("/:id", noteController.getById);
  noteRoutes.post("/", noteController.create);
  noteRoutes.put("/:id", noteController.update);
  noteRoutes.delete("/:id", noteController.delete);

  return noteRoutes;
};
