/**
 * Valibot validation schema for User
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for User
 * User model with readOnly fields
 */
export const UserSchema = v.object({
  id: v.string(), // readOnly
  username: v.string(),
  email: v.pipe(v.string(), v.email()),
  createdAt: v.optional(v.pipe(v.string(), v.isoDateTime(), v.transform((val) => new Date(val)))), // readOnly
  updatedAt: v.optional(v.pipe(v.string(), v.isoDateTime(), v.transform((val) => new Date(val)))), // readOnly
});