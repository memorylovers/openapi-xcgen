/**
 * Valibot validation schemas
 * Generated from: Validation Test API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for User
 */
export const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()), // readOnly
  username: v.pipe(v.string(), v.minLength(3), v.maxLength(20), v.regex(/^[a-zA-Z0-9_]+$/)),
  email: v.pipe(v.string(), v.email()),
  age: v.optional(v.nullable(v.pipe(v.number(), v.minValue(0), v.maxValue(150)))),
  bio: v.optional(v.pipe(v.string(), v.maxLength(500))),
  website: v.optional(v.nullable(v.pipe(v.string(), v.url()))),
});

/**
 * Schema for CreateUserRequest
 */
export const CreateUserRequestSchema = v.object({
  username: v.pipe(v.string(), v.minLength(3), v.maxLength(20), v.regex(/^[a-zA-Z0-9_]+$/)),
  email: v.pipe(v.string(), v.email()),
  age: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(150))),
  bio: v.optional(v.pipe(v.string(), v.maxLength(500))),
  website: v.optional(v.pipe(v.string(), v.url())),
});
