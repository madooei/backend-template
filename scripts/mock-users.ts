import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";

export const users: AuthenticatedUserContextType[] = [
  {
    userId: "user-1",
    globalRole: "user",
  },
  {
    userId: "user-2",
    globalRole: "user",
  },
  {
    userId: "admin-1",
    globalRole: "admin",
  },
];
