import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import {
  createAuthMiddleware,
  type AuthMiddlewareDeps,
} from "@/middlewares/auth.middleware";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";
import { ServiceUnavailableError, UnauthenticatedError } from "@/errors";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "@/schemas/app-env.schema";

// Mock service instance that will be created in beforeEach
let mockAuthService: AuthMiddlewareDeps["authenticationService"];
let authMiddlewareToTest: MiddlewareHandler<AppEnv>;

function createMockContext(headers: Record<string, string> = {}) {
  return {
    req: {
      header: (name: string) => headers[name],
    },
    set: vi.fn(),
    var: {}, // Add var to satisfy Hono's context expectations if needed by middleware
  } as any;
}

describe("authMiddleware (with DI)", () => {
  let user: AuthenticatedUserContextType;
  let next: Mock;

  beforeEach(() => {
    // Create a mock AuthenticationService with a vi.fn() for the method we use
    mockAuthService = {
      authenticateUserByToken: vi.fn(),
    } as AuthMiddlewareDeps["authenticationService"];

    // Create the middleware instance for testing, injecting the mock service
    authMiddlewareToTest = createAuthMiddleware({
      authenticationService: mockAuthService,
    });

    user = { userId: "user-1", globalRole: "user" };
    next = vi.fn();
  });

  it("throws UnauthenticatedError if Authorization header is missing", async () => {
    const c = createMockContext();
    await expect(authMiddlewareToTest(c, next)).rejects.toThrow(
      UnauthenticatedError,
    );
    expect(mockAuthService.authenticateUserByToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("throws UnauthenticatedError if Authorization header is invalid format (not Bearer)", async () => {
    const c = createMockContext({ Authorization: "InvalidToken" });
    await expect(authMiddlewareToTest(c, next)).rejects.toThrow(
      UnauthenticatedError,
    );
    expect(mockAuthService.authenticateUserByToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("throws UnauthenticatedError if token is missing after 'Bearer '", async () => {
    const c = createMockContext({ Authorization: "Bearer " });
    await expect(authMiddlewareToTest(c, next)).rejects.toThrow(
      UnauthenticatedError,
    );
    expect(mockAuthService.authenticateUserByToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("throws UnauthenticatedError if authenticationService.authenticateUserByToken throws UnauthenticatedError", async () => {
    const c = createMockContext({ Authorization: "Bearer valid-token" });
    (mockAuthService.authenticateUserByToken as Mock).mockRejectedValue(
      new UnauthenticatedError("Token is invalid or expired"),
    );
    await expect(authMiddlewareToTest(c, next)).rejects.toThrow(
      UnauthenticatedError,
    );
    expect(mockAuthService.authenticateUserByToken).toHaveBeenCalledWith(
      "valid-token",
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("throws ServiceUnavailableError if authenticationService.authenticateUserByToken throws ServiceUnavailableError", async () => {
    const c = createMockContext({ Authorization: "Bearer valid-token" });
    (mockAuthService.authenticateUserByToken as Mock).mockRejectedValue(
      new ServiceUnavailableError("Auth service is temporarily down"),
    );
    await expect(authMiddlewareToTest(c, next)).rejects.toThrow(
      ServiceUnavailableError,
    );
    expect(mockAuthService.authenticateUserByToken).toHaveBeenCalledWith(
      "valid-token",
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("throws the original error from service if it's not a known business error handled by middleware", async () => {
    const c = createMockContext({ Authorization: "Bearer valid-token" });
    const genericError = new Error("Some unexpected error");
    (mockAuthService.authenticateUserByToken as Mock).mockRejectedValue(
      genericError,
    );

    await expect(authMiddlewareToTest(c, next)).rejects.toThrow(genericError);
    expect(mockAuthService.authenticateUserByToken).toHaveBeenCalledWith(
      "valid-token",
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("sets user on context and calls next() if authentication is successful", async () => {
    const c = createMockContext({ Authorization: "Bearer valid-token" });
    (mockAuthService.authenticateUserByToken as Mock).mockResolvedValue(user);

    await authMiddlewareToTest(c, next);

    expect(mockAuthService.authenticateUserByToken).toHaveBeenCalledWith(
      "valid-token",
    );
    expect(c.set).toHaveBeenCalledWith("user", user);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
