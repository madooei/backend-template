import { Hono } from "hono";
import { appEvents } from "@/events/event-emitter";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { AuthorizationService } from "@/services/authorization.service";
import type { AppEnv } from "@/schemas/app-env.schema";
import type { ServiceEventType } from "@/schemas/event.schema";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";
import { authMiddleware as defaultAuthMiddleware } from "@/middlewares/auth.middleware";

// Add interface for controller with cleanup function
interface SSEController extends ReadableStreamDefaultController<Uint8Array> {
  cleanup?: () => void;
}

interface EventsRouteOptions {
  authMiddleware?: typeof defaultAuthMiddleware;
}

export function createEventsRoutes(options?: EventsRouteOptions) {
  const router = new Hono<AppEnv>();

  // Use injected middleware or default
  const authMiddlewareToUse = options?.authMiddleware || authMiddleware;

  router.get("/", authMiddlewareToUse, async (c) => {
    const currentUser = c.var.user;
    if (!currentUser) {
      return c.text("Unauthorized", 401);
    }

    const authorizationService = new AuthorizationService();

    // Return a Response with a ReadableStream
    const readable = new ReadableStream({
      start(controller: SSEController) {
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
          } catch (error: unknown) {
            console.error(
              "Error in event handler:",
              error instanceof Error ? error.message : String(error),
            );
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
          } catch (error: unknown) {
            console.error(
              "Heartbeat error:",
              error instanceof Error ? error.message : String(error),
            );
            clearInterval(keepAlive);
          }
        }, 30000);

        // Store cleanup function
        controller.cleanup = () => {
          appEvents.off("notes:created", eventHandler);
          appEvents.off("notes:updated", eventHandler);
          appEvents.off("notes:deleted", eventHandler);
          clearInterval(keepAlive);
        };
      },
      cancel(controller: SSEController) {
        // Cleanup when client disconnects
        if (controller.cleanup) {
          controller.cleanup();
        }
      },
    });

    // Set SSE headers directly on the Response object
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
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
