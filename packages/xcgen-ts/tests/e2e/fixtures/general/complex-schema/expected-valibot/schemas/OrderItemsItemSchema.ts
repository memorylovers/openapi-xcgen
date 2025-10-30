/**
 * Valibot validation schema for OrderItemsItem
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for OrderItemsItem
 */
export const OrderItemsItemSchema = v.object({
  productId: v.string(),
  quantity: v.number(),
  price: v.optional(v.number()),
  discount: v.optional(v.number()),
});