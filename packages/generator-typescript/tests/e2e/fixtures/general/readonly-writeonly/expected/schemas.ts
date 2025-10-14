/**
 * Valibot validation schemas
 * Generated from: ReadOnly/WriteOnly Test API 1.0.0
 * DO NOT EDIT - This file is auto-generated
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
  createdAt: v.optional(v.string()), // readOnly
  updatedAt: v.optional(v.string()), // readOnly
});

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

/**
 * Schema for UserUpdate
 * User update model with both readOnly and writeOnly fields
 */
export const UserUpdateSchema = v.object({
  username: v.optional(v.string()),
  email: v.optional(v.pipe(v.string(), v.email())),
  currentPassword: v.optional(v.string()),
  newPassword: v.optional(v.string()),
  lastLoginAt: v.optional(v.string()), // readOnly
});
