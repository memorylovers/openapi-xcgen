/**
 * Valibot validation schema for Order
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { OrderCustomerSchema } from './OrderCustomerSchema';
import { OrderItemsSchema } from './OrderItemsSchema';
import { OrderMetadataSchema } from './OrderMetadataSchema';
import { OrderPrioritySchema } from './OrderPrioritySchema';
import { OrderStatusSchema } from './OrderStatusSchema';
import { OrderTagsSchema } from './OrderTagsSchema';

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
  createdAt: v.optional(v.pipe(v.string(), v.isoDateTime(), v.transform((val) => new Date(val)))),
  updatedAt: v.optional(v.pipe(v.string(), v.isoDateTime(), v.transform((val) => new Date(val)))),
});