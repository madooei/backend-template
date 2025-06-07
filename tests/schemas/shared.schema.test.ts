import { describe, it, expect } from "vitest";
import { queryParamsSchema } from "@/schemas/shared.schema";
import {
  paginatedResultsSchema,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
} from "@/schemas/shared.schema";
import { z } from "zod";

describe("queryParamsSchema", () => {
  it("accepts empty object (all optional)", () => {
    expect(queryParamsSchema.parse({})).toEqual({});
  });
  it("coerces page and limit to numbers", () => {
    const parsed = queryParamsSchema.parse({ page: "2", limit: "5" });
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(5);
  });
  it("accepts valid sortOrder", () => {
    expect(queryParamsSchema.parse({ sortOrder: "asc" }).sortOrder).toBe("asc");
    expect(queryParamsSchema.parse({ sortOrder: "desc" }).sortOrder).toBe(
      "desc",
    );
  });
  it("rejects invalid sortOrder", () => {
    expect(() => queryParamsSchema.parse({ sortOrder: "bad" })).toThrow();
  });
});

describe("paginatedResultsSchema", () => {
  const itemSchema = z.object({ id: z.string() });
  const schema = paginatedResultsSchema(itemSchema);

  it("accepts valid paginated result", () => {
    const input = {
      data: [{ id: "a" }, { id: "b" }],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    expect(schema.parse(input)).toEqual(input);
  });

  it("applies default values for page and limit", () => {
    const input = {
      data: [],
      total: 0,
      totalPages: 0,
    };
    const parsed = schema.parse(input);
    expect(parsed.page).toBe(DEFAULT_PAGE);
    expect(parsed.limit).toBe(DEFAULT_LIMIT);
  });

  it("rejects negative total", () => {
    const input = {
      data: [],
      total: -1,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
    expect(() => schema.parse(input)).toThrow();
  });

  it("rejects invalid data items", () => {
    const input = {
      data: [{ id: 123 }], // id should be string
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    expect(() => schema.parse(input)).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => schema.parse({})).toThrow();
  });
});
