import type { HTTPExceptionOptions } from "@/schemas/shared.schema.ts";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class UnauthorizedHTTPException extends HTTPException {
  constructor(options?: HTTPExceptionOptions) {
    const status = 403 as ContentfulStatusCode;
    const message = options?.message || "Unauthorized";
    const cause = options?.cause;
    const res = options?.res;

    super(status, { message, cause, res });
    this.name = "UnauthorizedHTTPException";
  }
}
