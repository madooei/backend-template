import { describe, it, expect } from "vitest";
import {
  noteSchema,
  createNoteSchema,
  updateNoteSchema,
  noteQueryParamsSchema,
} from "@/schemas/note.schema";

describe("noteSchema", () => {
  it("accepts valid note", () => {
    const valid = {
      id: "1",
      content: "Hello",
      createdBy: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(noteSchema.parse(valid)).toEqual(valid);
  });
  it("rejects missing required fields", () => {
    expect(() => noteSchema.parse({})).toThrow();
  });
});

describe("createNoteSchema", () => {
  it("accepts valid create note", () => {
    expect(createNoteSchema.parse({ content: "Hi" })).toEqual({
      content: "Hi",
    });
  });
  it("rejects empty content", () => {
    expect(() => createNoteSchema.parse({ content: "" })).toThrow();
  });
  it("rejects missing content", () => {
    expect(() => createNoteSchema.parse({})).toThrow();
  });
});

describe("updateNoteSchema", () => {
  it("accepts partial update", () => {
    expect(updateNoteSchema.parse({ content: "Updated" })).toEqual({
      content: "Updated",
    });
  });
  it("accepts empty object (no update)", () => {
    expect(updateNoteSchema.parse({})).toEqual({});
  });
});

describe("noteQueryParamsSchema", () => {
  it("coerces page and limit to numbers", () => {
    const parsed = noteQueryParamsSchema.parse({ page: "2", limit: "5" });
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(5);
  });
  it("accepts optional createdBy", () => {
    expect(noteQueryParamsSchema.parse({ createdBy: "user-1" }).createdBy).toBe(
      "user-1",
    );
  });
  it("accepts empty object (all optional)", () => {
    expect(noteQueryParamsSchema.parse({})).toEqual({});
  });
});
