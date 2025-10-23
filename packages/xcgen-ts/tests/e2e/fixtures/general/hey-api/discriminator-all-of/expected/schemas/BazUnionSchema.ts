/**
 * Valibot validation schemas
 * Generated from: OpenAPI 3.1.0 discriminator all of example 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for BazUnion
 */
export const BazUnionSchema = v.object({
  id: v.optional(v.string()),
  baz: v.optional(v.string()),
});
