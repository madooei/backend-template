import { Hono } from "hono";
import { createNoteRoutes } from "@/routes/note.router.ts";
import { NoteController } from "@/controllers/note-controller.ts";
import { NoteService } from "@/services/note.service.ts";
import { MockDbNoteRepository } from "@/repositories/mockdb/note.mockdb.repository.ts";
import type { AppEnv } from "@/schemas/app-env.schema.ts";
import { HTTPException } from "hono/http-exception";
import { NotFoundError } from "@/errors/not-found.error.ts";
import { UnauthenticatedError } from "@/errors/unauthenticated.error.ts";
import { ServiceUnavailableError } from "@/errors/service-unavailable.error.ts";
import { UnauthorizedError } from "@/errors/unauthorized.error.ts";
import { BadRequestError } from "@/errors/bad-request.error.ts";

export const app = new Hono<AppEnv>();

app.get("/", (c) => {
  console.log("Hello Hono!"); // Let's stop here to test the debugger (add a breakpoint here, and run the debugger)
  return c.text("Hello Hono!");
});

const noteService = new NoteService(new MockDbNoteRepository());
const noteController = new NoteController(noteService);
app.route("/notes", createNoteRoutes(noteController));

// Health check route
app.get("/health", (c) => c.json({ status: "ok" }));

// 404 route (must be last)
app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError((err, c) => {
  console.error(err);
  if (err instanceof HTTPException) {
    return c.json({ error: err.message, cause: err.cause }, err.status);
  } else if (err instanceof NotFoundError) {
    return c.json({ error: err.message }, 404);
  } else if (err instanceof UnauthenticatedError) {
    return c.json({ error: err.message }, 401);
  } else if (err instanceof UnauthorizedError) {
    return c.json({ error: err.message }, 403);
  } else if (err instanceof ServiceUnavailableError) {
    return c.json({ error: err.message }, 503);
  } else if (err instanceof BadRequestError) {
    return c.json({ error: err.message }, 400);
  } else {
    return c.json({ error: "Internal Server Error" }, 500);
  }
});
