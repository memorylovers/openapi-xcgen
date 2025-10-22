/**
 * Valibot validation schemas
 * Generated from: Complex Structures Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for Level1Data
 */
export const Level1DataSchema = v.object({
  value: v.optional(v.string()),
});

/**
 * Schema for Level1
 */
export const Level1Schema = v.object({
  data: v.optional(Level1DataSchema),
});

/**
 * Schema for Level2OuterInner
 */
export const Level2OuterInnerSchema = v.object({
  value: v.optional(v.string()),
});

/**
 * Schema for Level2Outer
 */
export const Level2OuterSchema = v.object({
  inner: v.optional(Level2OuterInnerSchema),
});

/**
 * Schema for Level2
 */
export const Level2Schema = v.object({
  outer: v.optional(Level2OuterSchema),
});

/**
 * Schema for Level3Level1Level2Level3
 */
export const Level3Level1Level2Level3Schema = v.object({
  value: v.optional(v.string()),
});

/**
 * Schema for Level3Level1Level2
 */
export const Level3Level1Level2Schema = v.object({
  level3: v.optional(Level3Level1Level2Level3Schema),
});

/**
 * Schema for Level3Level1
 */
export const Level3Level1Schema = v.object({
  level2: v.optional(Level3Level1Level2Schema),
});

/**
 * Schema for Level3
 */
export const Level3Schema = v.object({
  level1: v.optional(Level3Level1Schema),
});

/**
 * Schema for TeamMembersItem
 */
export const TeamMembersItemSchema = v.object({
  name: v.optional(v.string()),
});

/**
 * Schema for TeamMembers
 */
export const TeamMembersSchema = v.array(TeamMembersItemSchema);

/**
 * Schema for Team
 */
export const TeamSchema = v.object({
  members: v.optional(TeamMembersSchema),
});

/**
 * Schema for User
 */
export const UserSchema = v.object({
  name: v.optional(v.string()),
});

/**
 * Schema for GetUsers200Response
 */
export const GetUsers200ResponseSchema = v.array(UserSchema);
