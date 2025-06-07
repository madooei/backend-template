# Server-Sent Events (SSE) Implementation Guide

Server-Sent Events (SSE) provide a way to push real-time updates from your server to connected clients. Unlike traditional HTTP requests that follow a request-response pattern, SSE maintains a persistent connection that allows the server to continuously send data to the client.

## Why Server-Sent Events?

In modern web applications, users expect real-time updates. When one user creates, updates, or deletes data, other users should see these changes immediately without refreshing their browsers. SSE provides an elegant solution for this requirement.

### SSE vs WebSockets vs Polling

| Method         | Use Case                 | Pros                                            | Cons                                |
| -------------- | ------------------------ | ----------------------------------------------- | ----------------------------------- |
| **SSE**        | Server-to-client updates | Simple, automatic reconnection, HTTP-compatible | One-way communication only          |
| **WebSockets** | Bi-directional real-time | Full duplex, low latency                        | More complex, connection management |
| **Polling**    | Simple real-time needs   | Easy to implement                               | Inefficient, higher server load     |

**SSE is perfect when you primarily need to push updates from server to client**, which covers most real-time notification scenarios.

## How SSE Works

SSE uses a special HTTP response format called `text/event-stream`. The server keeps the connection open and sends data in a specific format:

```plaintext
event: eventType
data: {"message": "Hello World"}

event: userUpdate
data: {"userId": "123", "action": "login"}
```

Clients can listen to these events using the browser's built-in `EventSource` API:

```javascript
const eventSource = new EventSource("/events");
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};
```

## Architecture Overview

Our SSE implementation follows a clean, event-driven architecture:

```plaintext
User Action → Service Layer → Event Emission → SSE Router → Connected Clients
```

Here's how the components work together:

1. **User performs action** (create, update, delete)
2. **Service layer** handles business logic and authorization
3. **BaseService** emits events to the central event emitter
4. **Event Router** listens for events and filters them based on user permissions
5. **Authorized clients** receive real-time updates via SSE streams

## Core Components

### 1. Event Schema Definition (`src/schemas/event.schema.ts`)

The event schema defines the structure of all events in our system:

```typescript
export const serviceEventSchema = z.object({
  id: z.string(), // Unique event identifier
  action: z.enum(["created", "updated", "deleted"]), // What happened
  data: z.unknown(), // The actual data (entity-specific)
  user: z
    .object({
      // Who performed the action
      id: z.string(),
    })
    .passthrough()
    .optional(),
  timestamp: z.date(), // When it happened
  resourceType: z.string(), // What type of resource ('notes', 'users', etc.)
});
```

**Key Design Decisions:**

- **Standardized structure**: All events follow the same pattern for consistency
- **Generic data field**: `z.unknown()` allows different entity types while maintaining type safety
- **Resource typing**: `resourceType` enables filtering by entity type
- **Optional user**: Supports both user actions and system events

### 2. Central Event Emitter (`src/events/event-emitter.ts`)

A singleton event emitter handles all application events:

```typescript
class AppEventEmitter extends EventEmitter {
  emitServiceEvent(serviceName: string, event: ServiceEventType) {
    this.emit(`${serviceName}:${event.action}`, event);
  }
}

export const appEvents = new AppEventEmitter();
```

**Why This Design:**

- **Centralized**: Single source of truth for all events
- **Namespace pattern**: `serviceName:action` prevents event name collisions
- **Singleton pattern**: Ensures all parts of the application use the same emitter
- **Type safety**: TypeScript ensures event structure consistency

### 3. Base Service Class (`src/events/base.service.ts`)

All services extend `BaseService` to automatically gain event emission capabilities:

```typescript
export abstract class BaseService {
  constructor(protected serviceName: string) {}

  protected emitEvent<T>(
    action: ServiceEventType["action"],
    data: T,
    options?: {
      id?: string;
      user?: { userId: string; [key: string]: unknown };
    },
  ) {
    const eventUser = options?.user
      ? {
          id: options.user.userId,
          ...options.user,
        }
      : undefined;

    appEvents.emitServiceEvent(this.serviceName, {
      id: options?.id || uuidv4(),
      action,
      data,
      user: eventUser,
      timestamp: new Date(),
      resourceType: this.serviceName,
    });
  }
}
```

**Key Features:**

- **Automatic event formatting**: Handles common event fields like timestamp and ID
- **Service-specific namespacing**: Uses `serviceName` for event organization
- **Flexible user context**: Supports both user actions and system events
- **UUID generation**: Provides unique IDs for event tracking

### 4. Service Implementation Example (`src/services/note.service.ts`)

Services extend `BaseService` and emit events after successful operations:

```typescript
export class NoteService extends BaseService {
  constructor(/* dependencies */) {
    super("notes"); // Sets the service name for events
  }

  async create(
    data: CreateNoteType,
    user: AuthenticatedUserContextType,
  ): Promise<NoteType> {
    // 1. Perform authorization checks
    const canCreate = await this.authorizationService.canCreateNote(user);
    if (!canCreate) throw new UnauthorizedError();

    // 2. Execute business logic
    const note = await this.noteRepository.create(data, user.userId);

    // 3. Emit event after successful operation
    this.emitEvent("created", note, {
      id: note.id,
      user,
    });

    return note;
  }
}
```

**Important Patterns:**

- **Emit after success**: Events are only emitted after operations complete successfully
- **Include context**: Pass user information for authorization filtering
- **Consistent timing**: All CRUD operations emit corresponding events

### 5. SSE Router Implementation (`src/routes/events.router.ts`)

The SSE router manages client connections and event streaming:

```typescript
export function createEventsRoutes() {
  const router = new Hono<AppEnv>();

  router.get("/events", authMiddleware, async (c) => {
    const currentUser = c.var.user;
    if (!currentUser) {
      return c.text("Unauthorized", 401);
    }

    const authorizationService = new AuthorizationService();

    // Create a ReadableStream for SSE
    const readable = new ReadableStream({
      start(controller) {
        // Send initial connection confirmation
        controller.enqueue(
          new TextEncoder().encode(`data: {"type":"connected"}\n\n`),
        );

        // Event handler with authorization filtering
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
            console.error("Error in event handler:", error.message);
          }
        };

        // Listen to all note events
        appEvents.on("notes:created", eventHandler);
        appEvents.on("notes:updated", eventHandler);
        appEvents.on("notes:deleted", eventHandler);

        // Heartbeat to keep connection alive
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
          } catch (error) {
            clearInterval(keepAlive);
          }
        }, 30000);

        // Cleanup function
        controller.cleanup = () => {
          appEvents.off("notes:created", eventHandler);
          appEvents.off("notes:updated", eventHandler);
          appEvents.off("notes:deleted", eventHandler);
          clearInterval(keepAlive);
        };
      },
      cancel(controller) {
        // Cleanup when client disconnects
        if (controller.cleanup) {
          controller.cleanup();
        }
      },
    });

    // Return SSE response with proper headers
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
```

**Critical Implementation Details:**

1. **Authentication Required**: Only authenticated users can connect to SSE
2. **ReadableStream**: Modern streaming API for efficient data transfer
3. **Event Filtering**: Authorization checks ensure users only receive events they're allowed to see
4. **Heartbeat**: Keeps connections alive and detects disconnections
5. **Proper Cleanup**: Removes event listeners when clients disconnect
6. **Error Handling**: Graceful degradation when authorization or streaming fails

### 6. Authorization Integration (`src/services/authorization.service.ts`)

The authorization service determines which events users can receive:

```typescript
async canReceiveNoteEvent(
  user: AuthenticatedUserContextType,
  noteData: { createdBy: string; [key: string]: unknown },
): Promise<boolean> {
  // Apply same rules as viewing notes
  if (this.isAdmin(user)) return true;
  if (noteData.createdBy === user.userId) return true;
  return false;
}
```

**Authorization Patterns:**

- **Consistent with CRUD permissions**: Event access follows the same rules as direct data access
- **Admin privileges**: Admins can receive all events
- **Owner permissions**: Users receive events for their own data
- **Async support**: Enables complex authorization logic with database queries

## Event Flow Example

Let's trace through a complete example of creating a note:

### 1. User Creates Note

```typescript
// Controller receives HTTP POST request
const note = await noteService.create(validatedBody, user);
```

### 2. Service Processes and Emits Event

```typescript
// NoteService.create()
const note = await this.noteRepository.create(data, user.userId);

this.emitEvent("created", note, {
  id: note.id,
  user,
});
```

### 3. Event Emitter Broadcasts

```typescript
// BaseService.emitEvent() creates and emits:
{
  id: "uuid-generated",
  action: "created",
  data: { id: "note-123", content: "Hello", createdBy: "user-456" },
  user: { id: "user-456", globalRole: "user" },
  timestamp: "2024-01-15T10:30:00Z",
  resourceType: "notes"
}

// AppEventEmitter broadcasts to: "notes:created"
```

### 4. SSE Router Receives and Filters

```typescript
// Event handler checks authorization
const canReceive = await authorizationService.canReceiveNoteEvent(
  currentUser,
  event.data,
);

if (canReceive) {
  // Send to client
  controller.enqueue(
    new TextEncoder().encode(
      `event: notes:created\ndata: ${JSON.stringify(event)}\n\n`,
    ),
  );
}
```

### 5. Client Receives Real-time Update

```javascript
// Client-side JavaScript
const eventSource = new EventSource("/events");
eventSource.addEventListener("notes:created", (event) => {
  const noteData = JSON.parse(event.data);
  updateUI(noteData); // User sees new note immediately
});
```

Here is another example of how to use the SSE implementation in a client-side React application:

```javascript
// Client-side React hook example
const useRealtimeNotes = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource("/api/events", {
      headers: { Authorization: `Bearer ${token}` },
    });

    eventSource.addEventListener("notes:created", () => {
      queryClient.invalidateQueries(["notes"]);
    });

    eventSource.addEventListener("notes:updated", () => {
      queryClient.invalidateQueries(["notes"]);
    });

    eventSource.addEventListener("notes:deleted", () => {
      queryClient.invalidateQueries(["notes"]);
    });

    return () => eventSource.close();
  }, []);
};
```

In the above example, the React hook `useRealtimeNotes` sets up an `EventSource` to listen for note-related events. When a note is created, updated, or deleted, it invalidates the corresponding query in React Query, ensuring the UI stays in sync with the latest data. This is a simple approach to allowing real-time updates in a React application using the SSE implementation. A more advanced implementation could use the payload of the event to update the application state directly, rather than invalidating the entire query.

## Security Considerations

### Authentication and Authorization

1. **Connection Authentication**: SSE endpoint requires valid authentication
2. **Event-level Authorization**: Each event is filtered based on user permissions
3. **Data Filtering**: Users only receive events for data they can access

### Performance and Scalability

1. **Connection Limits**: Monitor concurrent SSE connections
2. **Memory Management**: Proper cleanup prevents memory leaks
3. **Heartbeat Optimization**: 30-second intervals balance responsiveness and resource usage

### Error Handling

1. **Graceful Degradation**: Authorization failures don't crash the stream
2. **Connection Recovery**: Clients automatically reconnect on network issues
3. **Logging**: Error events are logged for debugging

## Testing SSE Implementation

### Unit Testing Event Emission

```typescript
describe("NoteService Events", () => {
  it("should emit created event after successful note creation", async () => {
    const eventSpy = vi.spyOn(appEvents, "emitServiceEvent");

    const note = await noteService.create(validNoteData, mockUser);

    expect(eventSpy).toHaveBeenCalledWith("notes", {
      action: "created",
      data: note,
      id: note.id,
      user: mockUser,
      timestamp: expect.any(Date),
    });
  });
});
```

### Integration Testing SSE Streams

```typescript
describe("Events SSE Endpoint", () => {
  it("should stream events to authenticated clients", async () => {
    const response = await app.request("/events", {
      headers: { Authorization: "Bearer valid-token" },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/event-stream");

    // Test event streaming
    appEvents.emitServiceEvent("notes", mockEvent);
    // Verify event was streamed to client
  });
});
```

## Best Practices

### 1. Event Design

- **Consistent structure**: All events follow the same schema
- **Sufficient context**: Include enough data for client-side updates
- **Atomic events**: One event per logical operation

### 2. Authorization

- **Defense in depth**: Check permissions at both connection and event level
- **Consistent rules**: Event permissions match CRUD operation permissions
- **Performance**: Optimize authorization checks for high-frequency events

### 3. Connection Management

- **Cleanup**: Always remove event listeners when connections close
- **Heartbeat**: Detect and handle disconnected clients
- **Limits**: Monitor and limit concurrent connections per user

### 4. Error Handling

- **Non-blocking**: Event emission failures shouldn't break main operations
- **Logging**: Log errors for debugging without exposing sensitive data
- **Graceful degradation**: Continue serving other clients when one fails

## Client-Side Implementation

### Basic EventSource Usage

```javascript
const eventSource = new EventSource("/events", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

eventSource.onopen = () => {
  console.log("Connected to event stream");
};

eventSource.addEventListener("notes:created", (event) => {
  const note = JSON.parse(event.data);
  addNoteToUI(note);
});

eventSource.addEventListener("notes:updated", (event) => {
  const note = JSON.parse(event.data);
  updateNoteInUI(note);
});

eventSource.addEventListener("notes:deleted", (event) => {
  const note = JSON.parse(event.data);
  removeNoteFromUI(note);
});

eventSource.onerror = (error) => {
  console.error("EventSource error:", error);
  // Implement reconnection logic if needed
};
```

### React Hook Example

```typescript
function useSSE() {
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  useEffect(() => {
    const source = new EventSource("/events");
    setEventSource(source);

    return () => {
      source.close();
    };
  }, []);

  const addEventListener = useCallback(
    (eventType: string, handler: (event: MessageEvent) => void) => {
      eventSource?.addEventListener(eventType, handler);

      return () => {
        eventSource?.removeEventListener(eventType, handler);
      };
    },
    [eventSource],
  );

  return { addEventListener };
}
```

## Summary

Our SSE implementation provides:

1. **Real-time updates** with automatic client synchronization
2. **Secure event streaming** with proper authentication and authorization
3. **Scalable architecture** with clean separation of concerns
4. **Robust error handling** and connection management
5. **Type-safe event system** with comprehensive testing

This architecture makes it easy to add real-time features to any part of your application by simply extending `BaseService` and emitting events after successful operations. The authorization system ensures users only receive updates they're permitted to see, maintaining security while providing a great user experience.
