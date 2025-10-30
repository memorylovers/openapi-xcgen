/**
 * Valibot validation schema for User
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for User
 */
export const UserSchema = v.object({
  userId: v.string(),
  email: v.string(),
  username: v.string(),
  phoneNumber: v.optional(v.string()),
});