/**
 * Valibot validation schema for BarUnion
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for BarUnion
 */
export const BarUnionSchema = v.object({
  id: v.optional(v.string()),
  bar: v.optional(v.string()),
});