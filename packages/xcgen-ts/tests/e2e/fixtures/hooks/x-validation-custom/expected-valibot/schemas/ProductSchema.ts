/**
 * Valibot validation schema for Product
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for Product
 */
export const ProductSchema = v.object({
  sku: v.string(),
  name: v.string(),
  price: v.number(),
  email: v.optional(v.string()),
});