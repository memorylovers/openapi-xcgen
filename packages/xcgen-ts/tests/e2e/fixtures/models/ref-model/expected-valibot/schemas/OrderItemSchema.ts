/**
 * Valibot validation schema for OrderItem
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for OrderItem
 */
export const OrderItemSchema = v.object({
  productId: v.optional(v.string()),
});