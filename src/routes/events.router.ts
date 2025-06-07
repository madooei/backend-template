import { Hono } from "hono";
import { appEvents } from "@/events/event-emitter";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { AuthorizationService } from "@/services/authorization.service";
import type { AppEnv } from "@/schemas/app-env.schema";
import type { ServiceEventType } from "@/schemas/event.schema";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";

export function createEventsRoutes() {
  const router = new Hono<AppEnv>();

  router.get("/events", authMiddleware, async (c) => {
    const currentUser = c.var.user;
    if (!currentUser) {
      return c.text("Unauthorized", 401);
    }

    // Set SSE headers
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");
    c.header("Access-Control-Allow-Origin", "*");

    const authorizationService = new AuthorizationService();

    // Return a Response with a ReadableStream
    const readable = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(
          new TextEncoder().encode(`data: {"type":"connected"}\n\n`),
        );

        const eventHandler = async (event: ServiceEventType) => {
          try {
            const canReceive = await shouldUserReceiveEvent(
              event,
              currentUser,
              authorizationService,
            );
            if (canReceive) {
              const eventData = `event: notes:${event.action}\ndata: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(new TextEncoder().encode(eventData));
            }
          } catch (error) {
            console.error("Error in event handler:", error);
          }
        };

        // Listen to all note events
        appEvents.on("notes:created", eventHandler);
        appEvents.on("notes:updated", eventHandler);
        appEvents.on("notes:deleted", eventHandler);

        // Keep connection alive with heartbeat
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
          } catch (error) {
            clearInterval(keepAlive);
          }
        }, 30000);

        // Store cleanup function for later use
        (controller as any).cleanup = () => {
          appEvents.off("notes:created", eventHandler);
          appEvents.off("notes:updated", eventHandler);
          appEvents.off("notes:deleted", eventHandler);
          clearInterval(keepAlive);
        };
      },
      cancel() {
        // Cleanup when client disconnects
        if ((this as any).cleanup) {
          (this as any).cleanup();
        }
      },
    });

    return new Response(readable);
  });

  return router;
}

async function shouldUserReceiveEvent(
  event: ServiceEventType,
  user: AuthenticatedUserContextType,
  authorizationService: AuthorizationService,
): Promise<boolean> {
  // Resource-specific authorization logic using AuthorizationService
  switch (event.resourceType) {
    case "notes":
      // Ensure event.data has the required structure for note events
      if (
        typeof event.data === "object" &&
        event.data !== null &&
        "createdBy" in event.data
      ) {
        return await authorizationService.canReceiveNoteEvent(
          user,
          event.data as { createdBy: string; [key: string]: unknown },
        );
      }
      return false;
    default:
      // Unknown resource types are not allowed
      return false;
  }
}
