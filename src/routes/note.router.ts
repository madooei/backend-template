import { Hono } from "hono";
import type { NoteController } from "@/controllers/note.controller";
import type { AppEnv } from "@/schemas/app-env.schema";
import { validate as defaultValidate } from "@/middlewares/validation.middleware";
import { entityIdParamSchema } from "@/schemas/shared.schema";
import { createNoteSchema, noteQueryParamsSchema } from "@/schemas/note.schema";
import { authMiddleware as defaultAuthMiddleware } from "@/middlewares/auth.middleware";

export interface CreateNoteRoutesDeps {
  noteController: NoteController;
  validate?: typeof defaultValidate;
  authMiddleware?: typeof defaultAuthMiddleware;
}

export const createNoteRoutes = (dependencies: CreateNoteRoutesDeps) => {
  const {
    noteController,
    validate = defaultValidate,
    authMiddleware = defaultAuthMiddleware,
  } = dependencies;

  const noteRoutes = new Hono<AppEnv>();

  // Authentication middleware
  noteRoutes.use("*", authMiddleware);

  noteRoutes.get(
    "/",
    validate({
      schema: noteQueryParamsSchema,
      source: "query",
      varKey: "validatedQuery",
    }),
    noteController.getAll,
  );

  noteRoutes.get(
    "/:id",
    validate({
      schema: entityIdParamSchema("id"),
      source: "params",
      varKey: "validatedParams",
    }),
    noteController.getById,
  );

  noteRoutes.post(
    "/",
    validate({
      schema: createNoteSchema,
      source: "body",
      varKey: "validatedBody",
    }),
    noteController.create,
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
    noteController.update,
  );

  noteRoutes.delete(
    "/:id",
    validate({
      schema: entityIdParamSchema("id"),
      source: "params",
      varKey: "validatedParams",
    }),
    noteController.delete,
  );

  return noteRoutes;
};
