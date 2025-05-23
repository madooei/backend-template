import { Hono } from "hono";
import type { NoteController } from "@/controllers/note-controller.ts";
import type { AppEnv } from "@/schemas/app-env.schema.ts";
import { validate } from "@/middlewares/validation.middleware.ts";
import { entityIdParamSchema } from "@/schemas/shared.schema.ts";
import {
  createNoteSchema,
  noteQueryParamsSchema,
} from "@/schemas/note.schema.ts";
import {
  authMiddleware,
  ensureAuthenticated,
} from "@/middlewares/auth.middleware.ts";

export const createNoteRoutes = (noteController: NoteController) => {
  const noteRoutes = new Hono<AppEnv>();

  // Authentication middleware
  noteRoutes.use("*", authMiddleware);
  // Guard against unauthenticated users
  noteRoutes.use("*", ensureAuthenticated);

  noteRoutes.get(
    "/",
    validate({
      schema: noteQueryParamsSchema,
      source: "query",
      varKey: "validatedQuery",
    }),
    noteController.getAll
  );

  noteRoutes.get(
    "/:id",
    validate({
      schema: entityIdParamSchema("id"),
      source: "params",
      varKey: "validatedParams",
    }),
    noteController.getById
  );

  noteRoutes.post(
    "/",
    validate({
      schema: createNoteSchema,
      source: "body",
      varKey: "validatedBody",
    }),
    noteController.create
  );

  noteRoutes.put(
    "/:id",
    validate({
      schema: entityIdParamSchema("id"),
      source: "params",
      varKey: "validatedParams",
    }),
    validate({
      schema: createNoteSchema,
      source: "body",
      varKey: "validatedBody",
    }),
    noteController.update
  );

  noteRoutes.delete(
    "/:id",
    validate({
      schema: entityIdParamSchema("id"),
      source: "params",
      varKey: "validatedParams",
    }),
    noteController.delete
  );

  return noteRoutes;
};
