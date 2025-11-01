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
  email: v.pipe(v.string(), v.email()),
});