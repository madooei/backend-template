import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "@/schemas/app-env.schema.ts";
import { AuthenticationService } from "@/services/authentication.service.ts";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas.ts";

const authenticationService = new AuthenticationService();

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    throw new HTTPException(401, {
      message: "Authentication required. Bearer token must be provided.",
    });
  }

  const parts = authHeader.split(" ");
  let token: string | undefined;

  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    token = parts[1];
  }

  if (!token) {
    throw new HTTPException(400, {
      message: "Invalid Authorization header format. Expected Bearer token.",
    });
  }

  let user: AuthenticatedUserContextType | null = null;

  try {
    user = await authenticationService.authenticateUserByToken(token);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid token")) {
      throw new HTTPException(401, {
        message: "Invalid token or insufficient permissions.",
      });
    }
    throw new HTTPException(503, {
      message: "Could not connect to user authentication service.",
    });
  }

  if (!user) {
    throw new HTTPException(401, {
      message: "Authentication failed: user not found or invalid token.",
    });
  }

  c.set("user", user);
  await next();
});

// Helper middleware to ensure a user is authenticated
// Can be applied to routes that strictly require an authenticated user
export const ensureAuthenticated = createMiddleware<AppEnv>(async (c, next) => {
  const user = c.get("user");
  if (!user) {
    throw new HTTPException(401, { message: "Authentication required." });
  }
  await next();
});
