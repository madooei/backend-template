import { z } from "zod";
import { globalRoleSchema } from "@/schemas/roles.schemas.ts";

export const authenticatedUserContextSchema = z.object({
  userId: z.string(),
  globalRole: globalRoleSchema,
});

export type AuthenticatedUserContextType = z.infer<
  typeof authenticatedUserContextSchema
>;
