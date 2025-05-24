import type { HTTPExceptionOptions } from "@/schemas/shared.schema.ts";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export class BadRequestHTTPException extends HTTPException {
  constructor(options?: HTTPExceptionOptions) {
    const status = 400 as ContentfulStatusCode;
    const message = options?.message || "Bad Request";
    const cause = options?.cause;
    const res = options?.res;

    super(status, { message, cause, res });
    this.name = "BadRequestHTTPException";
  }
}
