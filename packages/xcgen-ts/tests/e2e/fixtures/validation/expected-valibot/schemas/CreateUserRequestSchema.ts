/**
 * Valibot validation schema for CreateUserRequest
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for CreateUserRequest
 */
export const CreateUserRequestSchema = v.object({
  username: v.string(),
  email: v.string(),
  age: v.optional(v.number()),
  bio: v.optional(v.string()),
  website: v.optional(v.string()),
});