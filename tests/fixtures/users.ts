/**
 * Shared user fixtures for testing
 *
 * These fixtures provide consistent user contexts across all test files.
 * Import from "@/../tests/fixtures/users" or use relative path.
 *
 * Usage:
 *   import { adminUser, regularUser, otherUser } from "@/../tests/fixtures/users";
 *
 * Note: Use "@/../tests" because "@/" maps to "src/" and tests are outside src.
 */

import type { AuthenticatedUserContextType } from "@/schemas/user.schemas";

/**
 * Admin user with full access to all resources
 */
export const adminUser: AuthenticatedUserContextType = {
  userId: "admin-1",
  globalRole: "admin",
};

/**
 * Regular user - primary test user for ownership scenarios
 */
export const regularUser: AuthenticatedUserContextType = {
  userId: "user-1",
  globalRole: "user",
};

/**
 * Another regular user - for testing cross-user authorization
 */
export const otherUser: AuthenticatedUserContextType = {
  userId: "user-2",
  globalRole: "user",
};

/**
 * Creates a custom user fixture
 *
 * @param overrides - Partial user context to merge with defaults
 * @returns Complete user context
 *
 * @example
 * const moderator = createUser({ userId: "mod-1", globalRole: "moderator" as any });
 */
export const createUser = (
  overrides: Partial<AuthenticatedUserContextType> & { userId: string },
): AuthenticatedUserContextType => ({
  globalRole: "user",
  ...overrides,
});

/**
 * User IDs for use in test data creation
 */
export const userIds = {
  admin: adminUser.userId,
  regular: regularUser.userId,
  other: otherUser.userId,
} as const;
