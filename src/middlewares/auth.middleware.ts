import { createMiddleware } from "hono/factory";
import type { AppEnv } from "@/schemas/app-env.schema.ts";
import { AuthenticationService } from "@/services/authentication.service.ts";
import { UnauthenticatedError } from "@/errors.ts";

class TokenError extends UnauthenticatedError {
  constructor() {
    super("Authorization header is missing or invalid.");
  }
}

export interface AuthMiddlewareDeps {
  authenticationService: AuthenticationService;
}

// Factory function to create the auth middleware with injectable dependencies
export const createAuthMiddleware = (deps: AuthMiddlewareDeps) => {
  const { authenticationService } = deps;

  return createMiddleware<AppEnv>(async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) throw new TokenError();

    const parts = authHeader.split(" ");
    let token: string | undefined;

    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      token = parts[1];
    }
    if (!token) throw new TokenError();

    // Will throw errors if it cannot authenticate
    const user = await authenticationService.authenticateUserByToken(token);

    c.set("user", user);
    await next();
  });
};

const defaultAuthenticationService = new AuthenticationService();
export const authMiddleware = createAuthMiddleware({
  authenticationService: defaultAuthenticationService,
});
