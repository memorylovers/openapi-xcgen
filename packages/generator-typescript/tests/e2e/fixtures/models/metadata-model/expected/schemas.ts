/**
 * Valibot validation schemas
 * Generated from: Metadata Model Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for Article
 * Article model with metadata
 */
export const ArticleSchema = v.object({
  name: v.optional(v.string()),
  code: v.optional(v.string()),
  status: v.optional(v.string()),
  createdAt: v.optional(v.string()), // readOnly
  password: v.optional(v.string()),
  oldId: v.optional(v.string()),
});
