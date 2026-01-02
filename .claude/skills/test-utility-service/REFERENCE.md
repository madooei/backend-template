# Utility Service Test Reference

Complete test examples for utility services.

## Authentication Service Test

**File**: `tests/services/authentication.service.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AuthenticationService } from "@/services/authentication.service";
import { env } from "@/env";
import { authenticatedUserContextSchema } from "@/schemas/user.schemas";
import { ServiceUnavailableError, UnauthenticatedError } from "@/errors";

describe("AuthenticationService", () => {
  let service: AuthenticationService;
  const token = "test-token";
  const user = { userId: "user-1", globalRole: "user" };
  const validUserData = authenticatedUserContextSchema.parse(user);
  const authServiceUrl = "http://auth-service";

  beforeEach(() => {
    service = new AuthenticationService();
    env.AUTH_SERVICE_URL = authServiceUrl;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("authenticates and returns user on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => user,
      }),
    );
    const result = await service.authenticateUserByToken(token);
    expect(result).toEqual(validUserData);
  });

  it("throws UnauthenticatedError if user data is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ bad: "data" }),
      }),
    );
    await expect(service.authenticateUserByToken(token)).rejects.toThrow(
      UnauthenticatedError,
    );
  });

  it("throws UnauthenticatedError on 401/403", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "unauthorized",
      }),
    );
    await expect(service.authenticateUserByToken(token)).rejects.toThrow(
      UnauthenticatedError,
    );
  });

  it("throws ServiceUnavailableError on 5xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "server error",
      }),
    );
    await expect(service.authenticateUserByToken(token)).rejects.toThrow(
      ServiceUnavailableError,
    );
  });

  it("throws ServiceUnavailableError if fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error")),
    );
    await expect(service.authenticateUserByToken(token)).rejects.toThrow(
      ServiceUnavailableError,
    );
  });

  it("throws ServiceUnavailableError if AUTH_SERVICE_URL is not set", async () => {
    env.AUTH_SERVICE_URL = undefined;
    await expect(service.authenticateUserByToken(token)).rejects.toThrow(
      ServiceUnavailableError,
    );
  });
});
```

## Authorization Service Test

**File**: `tests/services/authorization.service.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AuthorizationService } from "@/services/authorization.service";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";
import type { NoteType } from "@/schemas/note.schema";

const adminUser: AuthenticatedUserContextType = {
  userId: "admin-1",
  globalRole: "admin",
};
const regularUser: AuthenticatedUserContextType = {
  userId: "user-1",
  globalRole: "user",
};
const otherUser: AuthenticatedUserContextType = {
  userId: "user-2",
  globalRole: "user",
};

const mockNoteOwnedByRegularUser: NoteType = {
  id: "note-1",
  content: "Test content",
  createdBy: regularUser.userId,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockNoteOwnedByOtherUser: NoteType = {
  id: "note-2",
  content: "Other user's content",
  createdBy: otherUser.userId,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("AuthorizationService", () => {
  let service: AuthorizationService;

  beforeEach(() => {
    service = new AuthorizationService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("isAdmin", () => {
    it("returns true for admin", () => {
      expect(service.isAdmin(adminUser)).toBe(true);
    });

    it("returns false for regular user", () => {
      expect(service.isAdmin(regularUser)).toBe(false);
    });
  });

  describe("canViewNote", () => {
    it("allows admin", async () => {
      await expect(
        service.canViewNote(adminUser, mockNoteOwnedByRegularUser),
      ).resolves.toBe(true);
    });

    it("allows owner", async () => {
      await expect(
        service.canViewNote(regularUser, mockNoteOwnedByRegularUser),
      ).resolves.toBe(true);
    });

    it("denies non-owner", async () => {
      await expect(
        service.canViewNote(regularUser, mockNoteOwnedByOtherUser),
      ).resolves.toBe(false);
    });
  });

  describe("canCreateNote", () => {
    it("allows admin", async () => {
      await expect(service.canCreateNote(adminUser)).resolves.toBe(true);
    });

    it("allows regular user", async () => {
      await expect(service.canCreateNote(regularUser)).resolves.toBe(true);
    });
  });

  describe("canUpdateNote", () => {
    it("allows admin", async () => {
      await expect(
        service.canUpdateNote(adminUser, mockNoteOwnedByRegularUser),
      ).resolves.toBe(true);
    });

    it("allows owner", async () => {
      await expect(
        service.canUpdateNote(regularUser, mockNoteOwnedByRegularUser),
      ).resolves.toBe(true);
    });

    it("denies non-owner", async () => {
      await expect(
        service.canUpdateNote(regularUser, mockNoteOwnedByOtherUser),
      ).resolves.toBe(false);
    });
  });

  describe("canDeleteNote", () => {
    it("allows admin", async () => {
      await expect(
        service.canDeleteNote(adminUser, mockNoteOwnedByRegularUser),
      ).resolves.toBe(true);
    });

    it("allows owner", async () => {
      await expect(
        service.canDeleteNote(regularUser, mockNoteOwnedByRegularUser),
      ).resolves.toBe(true);
    });

    it("denies non-owner", async () => {
      await expect(
        service.canDeleteNote(regularUser, mockNoteOwnedByOtherUser),
      ).resolves.toBe(false);
    });
  });

  describe("canReceiveNoteEvent", () => {
    it("allows admin to receive any note event", async () => {
      const noteData = { createdBy: "other-user", content: "Test note" };
      await expect(
        service.canReceiveNoteEvent(adminUser, noteData),
      ).resolves.toBe(true);
    });

    it("allows owner to receive their note events", async () => {
      const noteData = { createdBy: regularUser.userId, content: "Test note" };
      await expect(
        service.canReceiveNoteEvent(regularUser, noteData),
      ).resolves.toBe(true);
    });

    it("denies non-owner from receiving other users' note events", async () => {
      const noteData = { createdBy: otherUser.userId, content: "Test note" };
      await expect(
        service.canReceiveNoteEvent(regularUser, noteData),
      ).resolves.toBe(false);
    });
  });
});
```

## Test Coverage Checklist

### External API Service (AuthenticationService)

- [ ] Successful authentication returns valid user
- [ ] Invalid response data throws `UnauthenticatedError`
- [ ] 401/403 responses throw `UnauthenticatedError`
- [ ] 5xx responses throw `ServiceUnavailableError`
- [ ] Network errors throw `ServiceUnavailableError`
- [ ] Missing configuration throws `ServiceUnavailableError`

### Authorization Service

- [ ] `isAdmin` correctly identifies admin users
- [ ] `canView` allows admin and owner
- [ ] `canView` denies non-owner
- [ ] `canCreate` allows appropriate roles
- [ ] `canUpdate` allows admin and owner
- [ ] `canUpdate` denies non-owner
- [ ] `canDelete` allows admin and owner
- [ ] `canDelete` denies non-owner
- [ ] `canReceiveEvent` follows view permissions
