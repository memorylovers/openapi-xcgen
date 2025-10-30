/**
 * Valibot validation schema for Article
 * Auto-generated from OpenAPI specification
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
  createdAt: v.optional(v.string()),
  password: v.optional(v.string()),
  oldId: v.optional(v.string()),
});