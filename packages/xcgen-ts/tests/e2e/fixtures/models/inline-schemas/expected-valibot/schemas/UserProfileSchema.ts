/**
 * Valibot validation schema for UserProfile
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for UserProfile
 */
export const UserProfileSchema = v.object({
  bio: v.optional(v.string()),
  active: v.optional(v.boolean()),
});