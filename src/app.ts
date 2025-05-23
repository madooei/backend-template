import { Hono } from "hono";
import { createNoteRoutes } from "@/routes/note.router.ts";
import { NoteController } from "@/controllers/note-controller.ts";
import { NoteService } from "@/services/note.service.ts";
import { MockDbNoteRepository } from "@/repositories/mockdb/note.mockdb.repository.ts";

export const app = new Hono();

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
