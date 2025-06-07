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
