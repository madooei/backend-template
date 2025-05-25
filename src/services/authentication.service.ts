import { env } from "@/env.ts";
import { ServiceUnavailableError, UnauthenticatedError } from "@/errors.ts";
import { authenticatedUserContextSchema } from "@/schemas/user.schemas.ts";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas.ts";

class AuthServiceUnavailableError extends ServiceUnavailableError {
  constructor() {
    super(
      "User authentication service unavailable, not properly configured, or returned an error."
    );
  }
}

export class AuthenticationService {
  // No constructor dependencies needed if it only relies on env and static schemas

  public async authenticateUserByToken(
    token: string
  ): Promise<AuthenticatedUserContextType> {
    const authServiceUrl = env.AUTH_SERVICE_URL;

    if (!authServiceUrl) throw new AuthServiceUnavailableError();

    try {
      const response = await fetch(`${authServiceUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const rawUserData = await response.json();
        const parsedUserData =
          authenticatedUserContextSchema.safeParse(rawUserData);

        if (!parsedUserData.success) {
          console.error(
            "User data from auth-service is invalid:",
            parsedUserData.error.format(),
            "Raw data:",
            rawUserData
          );
          throw new UnauthenticatedError(
            "Invalid user data from auth-service."
          );
        }
        return parsedUserData.data;
      } else {
        // Log different statuses for debugging
        console.error(
          `auth-service returned error: ${response.status}`,
          await response.text()
        );
        if (response.status === 401 || response.status === 403) {
          throw new UnauthenticatedError(
            "Invalid token or insufficient permissions from auth-service."
          );
        } else {
          // For other errors (e.g., 5xx from auth-service), treat as a service error
          throw new AuthServiceUnavailableError();
        }
      }
    } catch (error) {
      if (
        error instanceof ServiceUnavailableError ||
        error instanceof UnauthenticatedError
      ) {
        throw error; // Re-throw specific known errors
      } else {
        throw new AuthServiceUnavailableError();
      }
    }
  }
}
