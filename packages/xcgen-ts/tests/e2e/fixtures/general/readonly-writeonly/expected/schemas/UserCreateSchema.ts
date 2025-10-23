/**
 * Valibot validation schema for UserCreate
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for UserCreate
 * User creation model with writeOnly fields
 */
export const UserCreateSchema = v.object({
  username: v.string(),
  email: v.pipe(v.string(), v.email()),
  password: v.string(),
  confirmPassword: v.string(),
});
