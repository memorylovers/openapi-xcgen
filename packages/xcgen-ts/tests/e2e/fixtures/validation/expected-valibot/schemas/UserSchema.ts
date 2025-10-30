/**
 * Valibot validation schema for User
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for User
 */
export const UserSchema = v.object({
  id: v.string(),
  username: v.string(),
  email: v.string(),
  age: v.optional(v.nullable(v.number())),
  bio: v.optional(v.string()),
  website: v.optional(v.nullable(v.string())),
});