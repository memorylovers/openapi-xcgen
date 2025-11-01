/**
 * Valibot validation schema for UserUpdate
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for UserUpdate
 * User update model with both readOnly and writeOnly fields
 */
export const UserUpdateSchema = v.object({
  username: v.optional(v.string()),
  email: v.optional(v.pipe(v.string(), v.email())),
  currentPassword: v.optional(v.string()),
  newPassword: v.optional(v.string()),
  lastLoginAt: v.optional(v.pipe(v.string(), v.isoDateTime(), v.transform((val) => new Date(val)))), // readOnly
});