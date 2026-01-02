# Utility Service Reference

Complete implementation examples for utility services.

## Authentication Service Example

**File**: `src/services/authentication.service.ts`

```typescript
import { env } from "@/env";
import { ServiceUnavailableError, UnauthenticatedError } from "@/errors";
import { authenticatedUserContextSchema } from "@/schemas/user.schemas";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";

export class AuthenticationService {
  public async authenticateUserByToken(
    token: string,
  ): Promise<AuthenticatedUserContextType> {
    const authServiceUrl = env.AUTH_SERVICE_URL;

    if (!authServiceUrl) {
      throw new ServiceUnavailableError(
        "User authentication service is not properly configured.",
      );
    }

    try {
      const response = await fetch(`${authServiceUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Handle HTTP error responses
        if (response.status === 401 || response.status === 403) {
          throw new UnauthenticatedError("Invalid authentication token");
        } else {
          throw new ServiceUnavailableError(
            `Authentication service error: ${response.status}`,
          );
        }
      }

      const rawUserData = await response.json();
      const parsedUserData =
        authenticatedUserContextSchema.safeParse(rawUserData);

      if (!parsedUserData.success) {
        console.error(
          "Invalid user data format from auth service:",
          parsedUserData.error.format(),
        );
        throw new UnauthenticatedError("Invalid user data format");
      }

      return parsedUserData.data;
    } catch (error) {
      // Only wrap unknown errors
      if (
        error instanceof UnauthenticatedError ||
        error instanceof ServiceUnavailableError
      ) {
        throw error;
      }

      console.error("Authentication service error:", error);
      throw new ServiceUnavailableError("Authentication service unavailable");
    }
  }
}
```

### Key Patterns in AuthenticationService

1. **Environment Configuration**: Reads from `env` (validated by Zod)
2. **Early Validation**: Checks config before making requests
3. **HTTP Error Mapping**: Maps HTTP status codes to domain errors
4. **Response Validation**: Validates external data with Zod schema
5. **Error Re-throwing**: Known errors pass through, unknown errors are wrapped

## Authorization Service Example

**File**: `src/services/authorization.service.ts`

```typescript
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";
import type { NoteType } from "@/schemas/note.schema";

export class AuthorizationService {
  isAdmin(user: AuthenticatedUserContextType): boolean {
    return user.globalRole === "admin";
  }

  // --- Note Permissions ---

  async canViewNote(
    user: AuthenticatedUserContextType,
    note: NoteType,
  ): Promise<boolean> {
    if (this.isAdmin(user)) return true;
    if (note.createdBy === user.userId) return true;
    return false;
  }

  async canCreateNote(user: AuthenticatedUserContextType): Promise<boolean> {
    if (this.isAdmin(user)) return true;
    if (user.globalRole === "user") return true;
    return false;
  }

  async canUpdateNote(
    user: AuthenticatedUserContextType,
    note: NoteType,
  ): Promise<boolean> {
    if (this.isAdmin(user)) return true;
    if (note.createdBy === user.userId) return true;
    return false;
  }

  async canDeleteNote(
    user: AuthenticatedUserContextType,
    note: NoteType,
  ): Promise<boolean> {
    if (this.isAdmin(user)) return true;
    if (note.createdBy === user.userId) return true;
    return false;
  }

  // --- Event Permissions ---

  async canReceiveNoteEvent(
    user: AuthenticatedUserContextType,
    noteData: { createdBy: string; [key: string]: unknown },
  ): Promise<boolean> {
    // Apply same rules as viewing notes
    if (this.isAdmin(user)) return true;
    if (noteData.createdBy === user.userId) return true;
    return false;
  }

  // --- Add More Permissions Here ---
}
```

### Key Patterns in AuthorizationService

1. **Sync Helper**: `isAdmin()` is synchronous (simple check)
2. **Async Methods**: Permission methods are `async` for flexibility
3. **Boolean Returns**: Return `true`/`false`, don't throw errors
4. **Admin Override**: Admin always gets permission first
5. **Owner Check**: Creator has permissions on their own resources
6. **Event Permissions**: Mirror view permissions for real-time events
7. **Organized Sections**: Group by entity with comment headers

## Adding Permissions for New Entities

When creating a new resource service, add these methods to `AuthorizationService`:

```typescript
// --- {Entity} Permissions ---

async canView{Entity}(
  user: AuthenticatedUserContextType,
  {entity}: {Entity}Type,
): Promise<boolean> {
  if (this.isAdmin(user)) return true;
  if ({entity}.createdBy === user.userId) return true;
  return false;
}

async canCreate{Entity}(user: AuthenticatedUserContextType): Promise<boolean> {
  if (this.isAdmin(user)) return true;
  if (user.globalRole === "user") return true;
  return false;
}

async canUpdate{Entity}(
  user: AuthenticatedUserContextType,
  {entity}: {Entity}Type,
): Promise<boolean> {
  if (this.isAdmin(user)) return true;
  if ({entity}.createdBy === user.userId) return true;
  return false;
}

async canDelete{Entity}(
  user: AuthenticatedUserContextType,
  {entity}: {Entity}Type,
): Promise<boolean> {
  if (this.isAdmin(user)) return true;
  if ({entity}.createdBy === user.userId) return true;
  return false;
}

// --- {Entity} Event Permissions ---

async canReceive{Entity}Event(
  user: AuthenticatedUserContextType,
  {entity}Data: { createdBy: string; [key: string]: unknown },
): Promise<boolean> {
  if (this.isAdmin(user)) return true;
  if ({entity}Data.createdBy === user.userId) return true;
  return false;
}
```

## Email Service Example (Template)

```typescript
import { env } from "@/env";
import { ServiceUnavailableError } from "@/errors";

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: boolean;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
}

export class EmailService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly fromAddress: string;

  constructor() {
    this.apiKey = env.EMAIL_API_KEY;
    this.apiUrl = env.EMAIL_API_URL;
    this.fromAddress = env.EMAIL_FROM_ADDRESS;

    if (!this.apiKey || !this.apiUrl || !this.fromAddress) {
      throw new ServiceUnavailableError(
        "Email service is not properly configured.",
      );
    }
  }

  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      const response = await fetch(`${this.apiUrl}/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: options.to,
          subject: options.subject,
          [options.html ? "html" : "text"]: options.body,
        }),
      });

      if (!response.ok) {
        throw new ServiceUnavailableError(
          `Email service error: ${response.status}`,
        );
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.id,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        throw error;
      }

      console.error("Email service error:", error);
      throw new ServiceUnavailableError("Email service unavailable");
    }
  }

  async sendTemplate(
    to: string,
    templateId: string,
    variables: Record<string, string>,
  ): Promise<EmailResult> {
    // Template-based email sending
    try {
      const response = await fetch(`${this.apiUrl}/send-template`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to,
          template_id: templateId,
          variables,
        }),
      });

      if (!response.ok) {
        throw new ServiceUnavailableError(
          `Email service error: ${response.status}`,
        );
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.id,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        throw error;
      }

      console.error("Email service error:", error);
      throw new ServiceUnavailableError("Email service unavailable");
    }
  }
}
```
