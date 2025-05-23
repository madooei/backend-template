import { env } from "@/env.ts";
import { authenticatedUserContextSchema } from "@/schemas/user.schemas.ts";
import type { AuthenticatedUserContextType } from "@/schemas/user.schemas.ts";

export class AuthenticationService {
  // No constructor dependencies needed if it only relies on env and static schemas

  public async authenticateUserByToken(
    token: string
  ): Promise<AuthenticatedUserContextType | null> {
    const authServiceUrl = env.AUTH_SERVICE_URL;

    if (!authServiceUrl) {
      // If AUTH_SERVICE_URL is not set, token authentication cannot proceed.
      // This scenario implies that this service must take care of authentication itself.
      // For now, we will simply return null.
      console.warn(
        "Attempted token authentication but AUTH_SERVICE_URL is not configured."
      );
      return null; // Or throw new Error("Token authentication is not configured.") if stricter
    }

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
          // This error will be caught by the caller (middleware) and transformed into an HTTPException
          throw new Error("Invalid user data from authentication service.");
        }
        return parsedUserData.data;
      } else {
        // Log different statuses for debugging
        console.error(
          `auth-service returned error: ${response.status}`,
          await response.text()
        );
        if (response.status === 401 || response.status === 403) {
          // Specific error for invalid token/permissions
          throw new Error(
            "Invalid token or insufficient permissions from auth-service."
          );
        } else {
          // For other errors (e.g., 5xx from auth-service), treat as a service error
          throw new Error(
            "User authentication service unavailable or returned an error."
          );
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Invalid token")) {
        throw error; // Re-throw specific known errors
      } else {
        throw new Error("Could not connect to user authentication service.");
      }
    }
  }
}
