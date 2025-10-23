/**
 * Valibot validation schema for User
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

export const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()), // readOnly
  username: v.pipe(v.string(), v.minLength(3), v.maxLength(20), v.regex(/^[a-zA-Z0-9_]+$/)),
  email: v.pipe(v.string(), v.email()),
  age: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(150)))),
  bio: v.optional(v.pipe(v.string(), v.maxLength(500))),
  website: v.optional(v.nullable(v.pipe(v.string(), v.url()))),
});
