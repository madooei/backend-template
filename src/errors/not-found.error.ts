import type { HTTPExceptionOptions } from "@/schemas/shared.schema.ts";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class NotFoundHTTPException extends HTTPException {
  constructor(options?: HTTPExceptionOptions) {
    const status = 404 as ContentfulStatusCode;
    const message = options?.message || "Not Found";
    const cause = options?.cause;
    const res = options?.res;

    super(status, { message, cause, res });
    this.name = "NotFoundHTTPException";
  }
}
