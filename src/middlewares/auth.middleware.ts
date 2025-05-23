import { createMiddleware } from "hono/factory";
import type { AppEnv } from "@/schemas/app-env.schema.ts";
import { AuthenticationService } from "@/services/authentication.service.ts";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas.ts";
import {
  UnauthenticatedError,
  UnauthenticatedHTTPException,
} from "@/errors/unauthenticated.error.ts";
import { ServiceUnavailableHTTPException } from "@/errors/service-unavailable.error.ts";
import { ServiceUnavailableError } from "@/errors/service-unavailable.error.ts";
import { InternalServerHTTPException } from "@/errors/internal-server.error.ts";

const authenticationService = new AuthenticationService();

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    throw new UnauthenticatedHTTPException({
      message: "Authentication required. Bearer token must be provided.",
    });
  }

  const parts = authHeader.split(" ");
  let token: string | undefined;

  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    token = parts[1];
  }

  if (!token) {
    throw new UnauthenticatedHTTPException({
      message: "Invalid Authorization header format. Expected Bearer token.",
    });
  }

  let user: AuthenticatedUserContextType | null = null;

  try {
    user = await authenticationService.authenticateUserByToken(token);
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      throw new UnauthenticatedHTTPException({
        message: error.message,
      });
    } else if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableHTTPException({
        message: error.message,
      });
    } else {
      throw new InternalServerHTTPException({
        message: "Could not connect to user authentication service.",
      });
    }
  }

  if (!user) {
    throw new UnauthenticatedHTTPException({
      message: "Authentication failed: user not found or invalid token.",
    });
  }

  c.set("user", user);
  await next();
});
