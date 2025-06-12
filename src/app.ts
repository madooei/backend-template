import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createNoteRoutes } from "@/routes/note.router";
import { createEventsRoutes } from "@/routes/events.router";
import { NoteController } from "@/controllers/note.controller";
import { NoteService } from "@/services/note.service";
import { MockDbNoteRepository } from "@/repositories/mockdb/note.mockdb.repository";
import { MongoDbNoteRepository } from "@/repositories/mongodb/note.mongodb.repository";
import type { AppEnv } from "@/schemas/app-env.schema";
import { globalErrorHandler } from "@/errors";
import { env } from "@/env";

export const app = new Hono<AppEnv>();

// We may want to let the API Gateway handle CORS and logging,
// but for development purposes, we can enable it here
app.use("/*", cors()); // Enable CORS for all routes
app.use(logger());

app.get("/", (c) => {
  console.log("Hello Hono!"); // Let's stop here to test the debugger (add a breakpoint here, and run the debugger)
  return c.text("Hello Hono!");
});

// Note routes
const noteRepository =
  env.NODE_ENV === "test"
    ? new MockDbNoteRepository()
    : new MongoDbNoteRepository();
const noteService = new NoteService(noteRepository);
const noteController = new NoteController(noteService);
app.route("/notes", createNoteRoutes({ noteController }));

// Events SSE endpoint
app.route("/events", createEventsRoutes());

// Health check route
app.get("/health", (c) => c.json({ status: "ok" }));

// 404 route (must be last)
app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError(globalErrorHandler);
