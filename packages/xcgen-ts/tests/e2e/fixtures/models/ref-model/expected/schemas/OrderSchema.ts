/**
 * Valibot validation schema for Order
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { CustomerSchema } from './CustomerSchema';
import { OrderItemsSchema } from './OrderItemsSchema';

/**
 * Schema for Order
 */
export const OrderSchema = v.object({
  customer: v.optional(CustomerSchema),
  items: v.optional(OrderItemsSchema),
});