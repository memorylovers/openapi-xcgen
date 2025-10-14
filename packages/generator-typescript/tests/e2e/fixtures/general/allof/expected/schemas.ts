/**
 * Valibot validation schemas
 * Generated from: allOf Composition Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for Base
 */
export const BaseSchema = v.object({
  id: v.string(),
  createdAt: v.optional(v.string()),
});

/**
 * Schema for UserAllOf1
 */
export const UserAllOf1Schema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
});

/**
 * Schema for User
 */
export const UserSchema = v.intersect([BaseSchema, UserAllOf1Schema]);

/**
 * Schema for Timestamps
 */
export const TimestampsSchema = v.object({
  createdAt: v.optional(v.string()),
  updatedAt: v.optional(v.string()),
});

/**
 * Schema for AuditableUserAllOf2Role
 */
export const AuditableUserAllOf2RoleSchema = v.picklist(["admin", "user", "guest"]);

/**
 * Schema for AuditableUserAllOf2
 */
export const AuditableUserAllOf2Schema = v.object({
  role: AuditableUserAllOf2RoleSchema,
});

/**
 * Schema for AuditableUser
 * User with audit timestamps
 */
export const AuditableUserSchema = v.intersect([BaseSchema, TimestampsSchema, AuditableUserAllOf2Schema]);
