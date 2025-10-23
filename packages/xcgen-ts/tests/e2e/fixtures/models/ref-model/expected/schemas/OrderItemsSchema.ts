/**
 * Valibot validation schemas
 * Generated from: Ref Model Test 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";
import { OrderItemSchema } from './OrderItemSchema';

/**
 * Schema for OrderItems
 */
export const OrderItemsSchema = v.array(OrderItemSchema);
