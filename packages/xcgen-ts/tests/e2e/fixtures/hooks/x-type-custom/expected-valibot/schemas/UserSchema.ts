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
  email: v.pipe(v.string(), v.email()),
  username: v.pipe(v.string(), v.minLength(3), v.maxLength(20)),
  phoneNumber: v.optional(v.string()),
});