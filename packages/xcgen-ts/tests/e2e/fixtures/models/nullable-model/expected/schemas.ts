/**
 * Valibot validation schemas
 * Generated from: Nullable Model Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for ProfileSettings
 */
export const ProfileSettingsSchema = v.object({
  theme: v.optional(v.string()),
});

/**
 * Schema for ProfileTags
 */
export const ProfileTagsSchema = v.array(v.string());

/**
 * Schema for Profile
 */
export const ProfileSchema = v.object({
  id: v.string(),
  name: v.optional(v.string()),
  bio: v.optional(v.nullable(v.string())),
  nickname: v.optional(v.nullable(v.string())),
  lastLoginDate: v.optional(v.nullable(v.pipe(v.string(), v.isoDateTime(), v.transform((val) => new Date(val))))),
  settings: v.optional(v.nullable(ProfileSettingsSchema)),
  tags: v.optional(v.nullable(ProfileTagsSchema)),
});
