# Issues with SSE

## ServiceEvent Interface Changes

### Issue

Original ServiceEvent interface included resource-specific fields (`visibility`, `ownerId`) that don't work generically across different entity types with varying authorization models.

### Solution

Make ServiceEvent generic and move authorization logic to resource-specific filtering functions.

### Updated Interface

```typescript
export interface ServiceEvent<T = any> {
  id: string; // Event's own ID for storage/audit
  action: "created" | "updated" | "deleted";
  data: T; // Full entity data
  user?: { id: string; [key: string]: any }; // Optional for system events
  timestamp: Date; // When event occurred
  resourceType: string; // 'notes', 'users', 'projects', etc.
}
```

### Key Changes

- **Removed**: `visibility`, `ownerId` (resource-specific)
- **Added**: `id` (event persistence), `timestamp`, `resourceType`
- **Made optional**: `user` (supports system-generated events)

### Authorization Pattern

Move permission logic to filtering function:

```typescript
function shouldUserReceiveEvent(
  event: ServiceEvent,
  currentUser: User,
): boolean {
  switch (event.resourceType) {
    case "notes":
      return true; // Public for now
    case "projects":
      return event.data.teamIds?.includes(currentUser.teamId);
    default:
      return false;
  }
}
```

This keeps events generic while supporting flexible per-resource authorization.
