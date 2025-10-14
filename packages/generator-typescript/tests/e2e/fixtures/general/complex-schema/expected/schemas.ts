/**
 * Valibot validation schemas
 * Generated from: Complex Schema API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for OrderItemsItem
 */
export const OrderItemsItemSchema = v.object({
  productId: v.string(),
  quantity: v.pipe(v.number(), v.minValue(1)),
  price: v.optional(v.number()),
  discount: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(100))),
});

/**
 * Schema for OrderItems
 */
export const OrderItemsSchema = v.array(OrderItemsItemSchema);

/**
 * Schema for OrderCustomerAddress
 */
export const OrderCustomerAddressSchema = v.object({
  street: v.optional(v.string()),
  city: v.optional(v.string()),
  country: v.optional(v.string()),
  zipCode: v.optional(v.pipe(v.string(), v.regex(/^\\d{5}(-\\d{4})?$/))),
});

/**
 * Schema for OrderCustomer
 */
export const OrderCustomerSchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.optional(v.pipe(v.string(), v.email())),
  address: v.optional(OrderCustomerAddressSchema),
});

/**
 * Schema for OrderStatus
 */
export const OrderStatusSchema = v.picklist(["pending", "processing", "shipped", "delivered", "cancelled"]);

/**
 * Schema for OrderPriority
 */
export const OrderPrioritySchema = v.picklist(["low", "normal", "high", "urgent"]);

/**
 * Schema for OrderTags
 */
export const OrderTagsSchema = v.array(v.string());

/**
 * Schema for OrderMetadata
 */
export const OrderMetadataSchema = v.record(v.string(), v.string());

/**
 * Schema for Order
 */
export const OrderSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  items: OrderItemsSchema,
  customer: OrderCustomerSchema,
  status: v.optional(OrderStatusSchema),
  priority: v.optional(OrderPrioritySchema),
  tags: v.optional(OrderTagsSchema),
  metadata: v.optional(OrderMetadataSchema),
  createdAt: v.optional(v.string()),
  updatedAt: v.optional(v.string()),
});
