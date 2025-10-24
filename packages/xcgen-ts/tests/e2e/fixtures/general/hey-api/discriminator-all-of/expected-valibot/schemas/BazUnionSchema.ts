/**
 * Valibot validation schema for BazUnion
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for BazUnion
 */
export const BazUnionSchema = v.object({
  id: v.optional(v.string()),
  baz: v.optional(v.string()),
});