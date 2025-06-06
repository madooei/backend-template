import { describe, it, expect, vi } from "vitest";
import { validate } from "@/middlewares/validation.middleware";
import { z } from "zod";
import { BadRequestError, InternalServerError } from "@/errors";

const testSchema = z.object({ foo: z.string(), bar: z.coerce.number() });

describe("validate middleware", () => {
  const next = vi.fn();

  it("validates body and sets varKey", async () => {
    const c = {
      req: { json: vi.fn().mockResolvedValue({ foo: "hi", bar: "2" }) },
      set: vi.fn(),
    } as any;
    const middleware = validate({
      schema: testSchema,
      source: "body",
      varKey: "validatedBody",
    });
    await middleware(c, next);
    expect(c.set).toHaveBeenCalledWith("validatedBody", { foo: "hi", bar: 2 });
    expect(next).toHaveBeenCalled();
  });

  it("throws BadRequestError for invalid body", async () => {
    const c = {
      req: { json: vi.fn().mockResolvedValue({ foo: 1, bar: "notnum" }) },
      set: vi.fn(),
    } as any;
    const middleware = validate({
      schema: testSchema,
      source: "body",
      varKey: "validatedBody",
    });
    await expect(middleware(c, next)).rejects.toThrow(BadRequestError);
  });

  it("throws BadRequestError for invalid JSON", async () => {
    const c = {
      req: { json: vi.fn().mockRejectedValue(new Error("Invalid JSON")) },
      set: vi.fn(),
    } as any;
    const middleware = validate({
      schema: testSchema,
      source: "body",
      varKey: "validatedBody",
    });
    await expect(middleware(c, next)).rejects.toThrow(BadRequestError);
  });

  it("validates query and sets varKey", async () => {
    const c = {
      req: { query: vi.fn().mockReturnValue({ foo: "hi", bar: "3" }) },
      set: vi.fn(),
    } as any;
    const middleware = validate({
      schema: testSchema,
      source: "query",
      varKey: "validatedQuery",
    });
    await middleware(c, next);
    expect(c.set).toHaveBeenCalledWith("validatedQuery", { foo: "hi", bar: 3 });
    expect(next).toHaveBeenCalled();
  });

  it("validates params and sets varKey", async () => {
    const c = {
      req: { param: vi.fn().mockReturnValue({ foo: "hi", bar: "4" }) },
      set: vi.fn(),
    } as any;
    const middleware = validate({
      schema: testSchema,
      source: "params",
      varKey: "validatedParams",
    });
    await middleware(c, next);
    expect(c.set).toHaveBeenCalledWith("validatedParams", {
      foo: "hi",
      bar: 4,
    });
    expect(next).toHaveBeenCalled();
  });

  it("throws InternalServerError for unknown source", async () => {
    const c = {
      req: {},
      set: vi.fn(),
    } as any;
    const middleware = validate({
      schema: testSchema,
      source: "unknown" as any,
      varKey: "bad",
    });
    await expect(middleware(c, next)).rejects.toThrow(InternalServerError);
  });
});
