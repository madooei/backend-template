import { z } from "zod";
import { globalRoleSchema } from "@/schemas/roles.schemas";

export const userIdSchema = z.string();

export type UserIdType = z.infer<typeof userIdSchema>;

export const authenticatedUserContextSchema = z.object({
  userId: userIdSchema,
  globalRole: globalRoleSchema,
});

export type AuthenticatedUserContextType = z.infer<
  typeof authenticatedUserContextSchema
>;
