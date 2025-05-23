import type { HTTPExceptionOptions } from "@/schemas/shared.schema.ts";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

export class ServiceUnavailableHTTPException extends HTTPException {
  constructor(options?: HTTPExceptionOptions) {
    const status = 503 as ContentfulStatusCode;
    const message = options?.message || "Service Unavailable";
    const cause = options?.cause;
    const res = options?.res;

    super(status, { message, cause, res });
    this.name = "ServiceUnavailableHTTPException";
  }
}
