import type { Context } from "hono";
import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "@/schemas/app-env.schema.ts";

export type ErrorCode = string | number;

export interface BaseErrorOptions {
  cause?: unknown;
  errorCode?: ErrorCode;
}

/**
 * BaseError class that extends Error, allowing for an optional cause and an error code.
 * The error code can be an HTTP status code or a custom string/number code.
 */
export class BaseError extends Error {
  public readonly cause?: unknown;
  public readonly errorCode?: ErrorCode;

  constructor(message: string, options?: BaseErrorOptions) {
    super(message);
    this.name = this.constructor.name;
    this.cause = options?.cause;
    this.errorCode = options?.errorCode;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Generates a JSON representation suitable for an API error response.
   * Matches the previous error structure of { error: message, cause?: ... }.
   */
  public toJSON(): { error: string; code?: ErrorCode; cause?: string } {
    const json: { error: string; code?: ErrorCode; cause?: string } = {
      error: this.message,
    };
    if (this.errorCode !== undefined) {
      json.code = this.errorCode;
    }
    if (this.cause instanceof Error && this.cause.message) {
      json.cause = this.cause.message;
    } else if (typeof this.cause === "string" && this.cause) {
      json.cause = this.cause;
    }
    return json;
  }
}

// Common HTTP Error classes derived from BaseError
// These use standard HTTP status codes as their errorCode.

export class BadRequestError extends BaseError {
  constructor(
    message: string = "Bad Request",
    options?: Omit<BaseErrorOptions, "errorCode">,
  ) {
    super(message, { ...options, errorCode: 400 });
  }
}

export class UnauthenticatedError extends BaseError {
  constructor(
    message: string = "Unauthenticated",
    options?: Omit<BaseErrorOptions, "errorCode">,
  ) {
    super(message, { ...options, errorCode: 401 });
  }
}

export class UnauthorizedError extends BaseError {
  constructor(
    message: string = "Unauthorized",
    options?: Omit<BaseErrorOptions, "errorCode">,
  ) {
    super(message, { ...options, errorCode: 403 });
  }
}

export class NotFoundError extends BaseError {
  constructor(
    message: string = "Resource Not Found",
    options?: Omit<BaseErrorOptions, "errorCode">,
  ) {
    super(message, { ...options, errorCode: 404 });
  }
}

export class InternalServerError extends BaseError {
  constructor(
    message: string = "Internal Server Error",
    options?: Omit<BaseErrorOptions, "errorCode">,
  ) {
    super(message, { ...options, errorCode: 500 });
  }
}

export class ServiceUnavailableError extends BaseError {
  constructor(
    message: string = "Service Unavailable",
    options?: Omit<BaseErrorOptions, "errorCode">,
  ) {
    super(message, { ...options, errorCode: 503 });
  }
}

/**
 * A generic HttpError class for creating errors with specific HTTP status codes
 * without needing a dedicated class for every possible status.
 */
export class HttpError extends BaseError {
  constructor(
    statusCode: number,
    message: string,
    options?: Omit<BaseErrorOptions, "errorCode">,
  ) {
    if (statusCode < 100 || statusCode > 599) {
      console.warn(
        `HttpError created with non-standard HTTP status code: ${statusCode}`,
      );
    }
    super(message, { ...options, errorCode: statusCode });
  }
}

/**
 * Helper function to create a Hono Response from a BaseError instance.
 * This can be used in the global error handler.
 */
export function createErrorResponse(c: Context, error: BaseError): Response {
  const errorBody = error.toJSON();
  let statusCode: StatusCode = 500; // Default

  if (
    typeof error.errorCode === "number" &&
    error.errorCode >= 100 &&
    error.errorCode < 600
  ) {
    statusCode = error.errorCode as StatusCode;
  }
  // If errorCode is a string, it's included in the body by toJSON().
  // The HTTP status code will be the default (500) or determined by other logic if needed.

  return c.json(errorBody, statusCode as ContentfulStatusCode);
}

export const globalErrorHandler = (err: Error, c: Context<AppEnv>) => {
  console.error(err); // It's good practice to log the original error

  if (err instanceof BaseError) {
    return createErrorResponse(c, err);
  } else if (err instanceof HTTPException) {
    // Handle Hono's built-in HTTPExceptions if you still use them directly anywhere
    // Consider if you want to wrap these in your BaseError structure too for consistency
    return c.json({ error: err.message, cause: err.cause }, err.status);
  } else {
    // Fallback for any other unexpected errors
    const internalError = new InternalServerError(
      "An unexpected error occurred",
      { cause: err },
    );
    return createErrorResponse(c, internalError);
  }
};
