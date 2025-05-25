import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AuthenticationService } from "@/services/authentication.service.ts";
import { env } from "@/env.ts";
import { authenticatedUserContextSchema } from "@/schemas/user.schemas.ts";
import { ServiceUnavailableError, UnauthenticatedError } from "@/errors.ts";

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
