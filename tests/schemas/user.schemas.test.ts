import { describe, it, expect } from "vitest";
import {
  userIdSchema,
  authenticatedUserContextSchema,
} from "@/schemas/user.schemas";

describe("userIdSchema", () => {
  it("accepts string userId", () => {
    expect(userIdSchema.parse("user-1")).toBe("user-1");
  });
  it("rejects non-string userId", () => {
    expect(() => userIdSchema.parse(123)).toThrow();
  });
});

describe("authenticatedUserContextSchema", () => {
  it("accepts valid user context", () => {
    const valid = { userId: "user-1", globalRole: "admin" };
    expect(authenticatedUserContextSchema.parse(valid)).toEqual(valid);
  });
  it("rejects missing userId", () => {
    expect(() =>
      authenticatedUserContextSchema.parse({ globalRole: "admin" }),
    ).toThrow();
  });
  it("rejects invalid globalRole", () => {
    expect(() =>
      authenticatedUserContextSchema.parse({
        userId: "user-1",
        globalRole: "bad",
      }),
    ).toThrow();
  });
});
