/**
 * Valibot validation schemas
 * Generated from: Data Types Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for DataTypesProfile
 */
export const DataTypesProfileSchema = v.object({
  bio: v.optional(v.string()),
});

/**
 * Schema for DataTypesTags
 */
export const DataTypesTagsSchema = v.array(v.string());

/**
 * Schema for DataTypesNumbers
 */
export const DataTypesNumbersSchema = v.array(v.number());

/**
 * Schema for DataTypesScores
 */
export const DataTypesScoresSchema = v.array(v.number());

/**
 * Schema for DataTypesFlags
 */
export const DataTypesFlagsSchema = v.array(v.boolean());

/**
 * Schema for DataTypes
 */
export const DataTypesSchema = v.object({
  id: v.optional(v.number()),
  name: v.optional(v.string()),
  score: v.optional(v.number()),
  isActive: v.optional(v.boolean()),
  birthDate: v.optional(v.string()),
  createdAt: v.optional(v.string()),
  profile: v.optional(DataTypesProfileSchema),
  tags: v.optional(DataTypesTagsSchema),
  numbers: v.optional(DataTypesNumbersSchema),
  scores: v.optional(DataTypesScoresSchema),
  flags: v.optional(DataTypesFlagsSchema),
});
