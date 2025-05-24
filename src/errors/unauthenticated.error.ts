import type { HTTPExceptionOptions } from "@/schemas/shared.schema.ts";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class UnauthenticatedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class UnauthenticatedHTTPException extends HTTPException {
  constructor(options?: HTTPExceptionOptions) {
    const status = 401 as ContentfulStatusCode;
    const message = options?.message || "Unauthenticated";
    const cause = options?.cause;
    const res = options?.res;

    super(status, { message, cause, res });
    this.name = "UnauthenticatedHTTPException";
  }
}
