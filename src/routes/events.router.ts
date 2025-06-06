import { Hono } from "hono";
import { stream } from "hono/streaming";
import { appEvents } from "@/events/event-emitter";
import { authMiddleware } from "@/middlewares/auth.middleware";
import type { AppEnv } from "@/schemas/app-env.schema";
import type { ServiceEvent } from "@/events/event-emitter";

export function createEventsRoutes() {
  const router = new Hono<AppEnv>();

  router.get("/events", authMiddleware, async (c) => {
    return stream(c, async (stream) => {
      // Set SSE headers
      c.header("Content-Type", "text/event-stream");
      c.header("Cache-Control", "no-cache");
      c.header("Connection", "keep-alive");
      c.header("Access-Control-Allow-Origin", "*");

      const eventHandler = (event: ServiceEvent) => {
        if (shouldUserReceiveEvent(event)) {
          stream.write(`event: notes:${event.action}\n`);
          stream.write(`data: ${JSON.stringify(event)}\n\n`);
        }
      };

      // Listen to all note events
      appEvents.on("notes:created", eventHandler);
      appEvents.on("notes:updated", eventHandler);
      appEvents.on("notes:deleted", eventHandler);

      // Keep connection alive with heartbeat
      const keepAlive = setInterval(() => {
        stream.write(": heartbeat\n\n");
      }, 30000);

      // Cleanup on disconnect
      stream.onAbort(() => {
        appEvents.off("notes:created", eventHandler);
        appEvents.off("notes:updated", eventHandler);
        appEvents.off("notes:deleted", eventHandler);
        clearInterval(keepAlive);
      });
    });
  });

  return router;
}

export function shouldUserReceiveEvent(event: ServiceEvent): boolean {
  // For now, all notes are public, so all authenticated users get events
  // Future: Could filter based on user permissions or ownership
  return event.visibility === "public";
}
