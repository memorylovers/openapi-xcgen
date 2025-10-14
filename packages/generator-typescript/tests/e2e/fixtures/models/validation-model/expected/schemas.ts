/**
 * Valibot validation schemas
 * Generated from: Validation Model Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for ProductTags
 */
export const ProductTagsSchema = v.array(v.string());

/**
 * Schema for Product
 */
export const ProductSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
  code: v.optional(v.pipe(v.string(), v.regex(/^[A-Z]{3}$/))),
  userId: v.optional(v.pipe(v.string(), v.uuid())),
  email: v.optional(v.pipe(v.string(), v.email())),
  website: v.optional(v.pipe(v.string(), v.url())),
  ipAddress: v.optional(v.string()),
  price: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(1000))),
  quantity: v.optional(v.pipe(v.number(), v.minValue(1))),
  tags: v.optional(ProductTagsSchema),
});
