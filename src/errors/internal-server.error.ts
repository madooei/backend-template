import type { HTTPExceptionOptions } from "@/schemas/shared.schema.ts";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class InternalServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InternalServerError";
  }
}

export class InternalServerHTTPException extends HTTPException {
  constructor(options?: HTTPExceptionOptions) {
    const status = 500 as ContentfulStatusCode;
    const message = options?.message || "Internal Server Error";
    const cause = options?.cause;
    const res = options?.res;

    super(status, { message, cause, res });
    this.name = "InternalServerHTTPException";
  }
}
