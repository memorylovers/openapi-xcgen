/**
 * Valibot validation schemas
 * Generated from: Ref Model Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for Customer
 */
export const CustomerSchema = v.object({
  name: v.optional(v.string()),
});

/**
 * Schema for OrderItem
 */
export const OrderItemSchema = v.object({
  productId: v.optional(v.string()),
});

/**
 * Schema for OrderItems
 */
export const OrderItemsSchema = v.array(OrderItemSchema);

/**
 * Schema for Order
 */
export const OrderSchema = v.object({
  customer: v.optional(CustomerSchema),
  items: v.optional(OrderItemsSchema),
});

/**
 * Schema for GetCustomers200Response
 */
export const GetCustomers200ResponseSchema = v.array(CustomerSchema);
