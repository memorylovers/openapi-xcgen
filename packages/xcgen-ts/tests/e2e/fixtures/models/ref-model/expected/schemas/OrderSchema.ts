/**
 * Valibot validation schemas
 * Generated from: Ref Model Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
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
