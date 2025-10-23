/**
 * Valibot validation schema for CreateUserRequest
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

export const CreateUserRequestSchema = v.object({
  username: v.pipe(v.string(), v.minLength(3), v.maxLength(20), v.regex(/^[a-zA-Z0-9_]+$/)),
  email: v.pipe(v.string(), v.email()),
  age: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(150))),
  bio: v.optional(v.pipe(v.string(), v.maxLength(500))),
  website: v.optional(v.pipe(v.string(), v.url())),
});
