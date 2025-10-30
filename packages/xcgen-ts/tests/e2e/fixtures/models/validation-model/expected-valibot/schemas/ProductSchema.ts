/**
 * Valibot validation schema for Product
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { ProductTagsSchema } from './ProductTagsSchema';

/**
 * Schema for Product
 */
export const ProductSchema = v.object({
  name: v.optional(v.string()),
  code: v.optional(v.string()),
  userId: v.optional(v.string()),
  email: v.optional(v.string()),
  website: v.optional(v.string()),
  ipAddress: v.optional(v.string()),
  price: v.optional(v.number()),
  quantity: v.optional(v.number()),
  tags: v.optional(ProductTagsSchema),
});